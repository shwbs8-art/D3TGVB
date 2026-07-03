'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config');
const { messagesDB, statsDB } = require('../database');
const { getServerStatus } = require('../services/statusService');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');
const logger = require('../utils/logger');
const { formatDuration, formatNow } = require('../utils/helpers');

const STATS_MESSAGE_KEY = 'statsMessage';

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('stats_refresh').setLabel('تحديث').setEmoji('🔄').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stats_players').setLabel('عرض اللاعبين').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('stats_serverinfo').setLabel('معلومات السيرفر').setEmoji('📈').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('stats_back').setLabel('رجوع').setEmoji('⬅').setStyle(ButtonStyle.Danger)
  );
}

function buildBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('stats_back').setLabel('رجوع').setEmoji('⬅').setStyle(ButtonStyle.Danger)
  );
}

async function buildStatsEmbed() {
  const server = await getServerStatus();
  const uptimeSeconds = botManager.getUptimeSeconds();

  const embed = new EmbedBuilder()
    .setTitle(config.serverName)
    .setColor(server.online ? 0x2ecc71 : 0xe74c3c)
    .addFields(
      { name: '🟢 حالة السيرفر', value: server.online ? 'متصل ✅' : 'غير متصل ❌', inline: true },
      { name: '👥 عدد اللاعبين', value: `${server.playersOnline}`, inline: true },
      { name: '👤 الحد الأقصى', value: `${server.playersMax}`, inline: true },
      { name: '📡 Ping', value: server.ping !== null ? `${server.ping}ms` : 'غير متاح', inline: true },
      { name: '📦 إصدار السيرفر', value: server.version || 'غير معروف', inline: true },
      { name: '🤖 حالة Mineflayer', value: botManager.isConnected ? 'متصل ✅' : 'غير متصل ❌', inline: true },
      { name: '⏳ وقت التشغيل', value: uptimeSeconds ? formatDuration(uptimeSeconds) : '—', inline: true },
      { name: '🕒 آخر تحديث', value: formatNow(), inline: false }
    )
    .setFooter({ text: 'Iraq Babylon Minecraft Bot' })
    .setTimestamp();

  return embed;
}

async function getStatsChannel(client) {
  const channelId = config.discord.statsChannelId;
  if (!channelId) {
    logger.warn('discord', 'لم يتم تحديد DISCORD_STATS_CHANNEL_ID في الإعدادات');
    return null;
  }
  try {
    const channel = await client.channels.fetch(channelId);
    return channel;
  } catch (err) {
    logger.error('error', `تعذر الوصول لروم الإحصائيات: ${err.message}`);
    return null;
  }
}

/**
 * ينشئ رسالة الإحصائيات أو يعدّل الموجودة (لا يكرر الرسائل أبدًا)
 */
async function initStatsMessage(client) {
  const channel = await getStatsChannel(client);
  if (!channel) return;

  const savedMessage = messagesDB.get(STATS_MESSAGE_KEY);
  const embed = await buildStatsEmbed();
  const buttons = buildButtons();

  if (savedMessage && savedMessage.messageId) {
    try {
      const existing = await channel.messages.fetch(savedMessage.messageId);
      await existing.edit({ embeds: [embed], components: [buttons] });
      logger.info('discord', 'تم تعديل رسالة الإحصائيات الموجودة');
      return;
    } catch (err) {
      logger.warn('discord', 'رسالة الإحصائيات المحفوظة لم تعد موجودة، سيتم إنشاء رسالة جديدة');
    }
  }

  const sent = await channel.send({ embeds: [embed], components: [buttons] });
  await messagesDB.set(STATS_MESSAGE_KEY, { messageId: sent.id, channelId: channel.id });
  logger.info('discord', 'تم إنشاء رسالة إحصائيات جديدة');
}

async function updateStatsMessage(client) {
  const channel = await getStatsChannel(client);
  if (!channel) return;

  const savedMessage = messagesDB.get(STATS_MESSAGE_KEY);
  if (!savedMessage || !savedMessage.messageId) {
    await initStatsMessage(client);
    return;
  }

  try {
    const existing = await channel.messages.fetch(savedMessage.messageId);
    const embed = await buildStatsEmbed();
    await existing.edit({ embeds: [embed], components: [buildButtons()] });
    await statsDB.set('lastUpdate', new Date().toISOString());
  } catch (err) {
    logger.warn('discord', `فشل تحديث رسالة الإحصائيات، سيُعاد إنشاؤها: ${err.message}`);
    await initStatsMessage(client);
  }
}

function startAutoUpdate(client) {
  const intervalMs = config.bot.statsUpdateIntervalMinutes * 60 * 1000;
  setInterval(() => {
    updateStatsMessage(client).catch((err) =>
      logger.error('error', `خطأ أثناء التحديث الدوري للإحصائيات: ${err.message}`)
    );
  }, intervalMs);
  logger.info('discord', `تم تفعيل التحديث التلقائي للإحصائيات كل ${config.bot.statsUpdateIntervalMinutes} دقيقة`);
}

/**
 * يتعامل مع تفاعلات الأزرار في رسالة الإحصائيات
 */
async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId === 'stats_refresh') {
    await interaction.deferUpdate();
    const embed = await buildStatsEmbed();
    await interaction.editReply({ embeds: [embed], components: [buildButtons()] });
    return;
  }

  if (customId === 'stats_players') {
    await interaction.deferReply({ ephemeral: true });
    let players = [];
    try {
      players = actions.getPlayerList(botManager);
    } catch {
      const server = await getServerStatus();
      players = server.playerSample;
    }

    const embed = new EmbedBuilder()
      .setTitle('👥 اللاعبون المتصلون حاليًا')
      .setColor(0x3498db)
      .setDescription(players.length ? players.map((p) => `• ${p}`).join('\n') : 'لا يوجد لاعبون متصلون حاليًا')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (customId === 'stats_serverinfo') {
    await interaction.deferReply({ ephemeral: true });
    const server = await getServerStatus();
    const uptimeSeconds = botManager.getUptimeSeconds();

    const embed = new EmbedBuilder()
      .setTitle('📈 معلومات السيرفر')
      .setColor(0x9b59b6)
      .addFields(
        { name: 'الحالة', value: server.online ? 'متصل ✅' : 'غير متصل ❌', inline: true },
        { name: 'Ping', value: server.ping !== null ? `${server.ping}ms` : 'غير متاح', inline: true },
        { name: 'الإصدار', value: server.version, inline: true },
        { name: 'عدد اللاعبين', value: `${server.playersOnline}`, inline: true },
        { name: 'الحد الأقصى', value: `${server.playersMax}`, inline: true },
        { name: 'وقت التشغيل', value: uptimeSeconds ? formatDuration(uptimeSeconds) : '—', inline: true },
        { name: 'عنوان السيرفر', value: `${config.minecraft.host}:${config.minecraft.port}`, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (customId === 'stats_back') {
    await interaction.deferUpdate();
    const embed = await buildStatsEmbed();
    await interaction.editReply({ embeds: [embed], components: [buildButtons()] });
  }
}

module.exports = {
  buildStatsEmbed,
  initStatsMessage,
  updateStatsMessage,
  startAutoUpdate,
  handleButtonInteraction,
  buildButtons,
  buildBackButton,
};
