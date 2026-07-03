'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const config = require('../config');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');
const { getServerStatus } = require('../services/statusService');
const { isAdmin } = require('../utils/permissions');
const logger = require('../utils/logger');
const { formatDuration } = require('../utils/helpers');

/* ==================== اللوحة الرئيسية ==================== */

function buildMainPanelEmbed() {
  return new EmbedBuilder()
    .setTitle(`🎮 لوحة تحكم البوت — ${config.serverName}`)
    .setColor(0x2ecc71)
    .setDescription(
      'تحكّم بالبوت داخل السيرفر مباشرة من Discord، بدون كتابة أي أمر.\n' +
        'الأزرار التي تحتاج بيانات (اسم لاعب، إحداثيات) ستفتح لك نافذة إدخال صغيرة.'
    )
    .addFields(
      { name: '📡 معلومات', value: 'تحديث • اللاعبون • معلومات السيرفر • الإحداثيات • إعادة الاتصال', inline: false },
      { name: '🏃 حركة وسلوك', value: 'قفز • نم • استيقظ • إيقاف الاتباع • الطقس', inline: false },
      { name: '🎯 تفاعل وإدارة', value: 'اتبع • اذهب • اسحب • اطرد • احظر (الإدارة فقط)', inline: false }
    )
    .setFooter({ text: 'Iraq Babylon Minecraft Bot' })
    .setTimestamp();
}

function buildMainPanelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_refresh').setLabel('تحديث').setEmoji('🔄').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('panel_players').setLabel('اللاعبون').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_serverinfo').setLabel('معلومات السيرفر').setEmoji('📈').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_coords').setLabel('الإحداثيات').setEmoji('📍').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_reconnect').setLabel('إعادة الاتصال').setEmoji('🔄').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_jump').setLabel('اقفز').setEmoji('🦘').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_sleep').setLabel('نم').setEmoji('😴').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_wake').setLabel('استيقظ').setEmoji('☀️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_stopfollow').setLabel('إيقاف الاتباع').setEmoji('⏹️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_weather').setLabel('الطقس').setEmoji('🌦️').setStyle(ButtonStyle.Primary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_follow').setLabel('اتبع').setEmoji('🎯').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_goto').setLabel('اذهب').setEmoji('🚶').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_pull').setLabel('اسحب').setEmoji('🪝').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_kick').setLabel('اطرد').setEmoji('👢').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_ban').setLabel('احظر').setEmoji('🔨').setStyle(ButtonStyle.Danger)
  );

  return [row1, row2, row3];
}

/* ==================== لوحة الطقس ==================== */

function buildWeatherPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🌦️ التحكم بالطقس والوقت')
    .setColor(0x3498db)
    .setDescription('اختر أي وضع تبيه للسيرفر — التغيير يصير فوري داخل اللعبة.')
    .setFooter({ text: 'يتطلب أن يكون حساب البوت Operator (OP) على السيرفر' })
    .setTimestamp();
}

function buildWeatherPanelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('weather_day').setLabel('نهار').setEmoji('☀️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('weather_night').setLabel('ليل').setEmoji('🌙').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('weather_clear').setLabel('صافي').setEmoji('🌤️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('weather_rain').setLabel('مطر').setEmoji('🌧️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('weather_thunder').setLabel('رعد').setEmoji('⛈️').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_back').setLabel('رجوع').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

/* ==================== نوافذ الإدخال (Modals) ==================== */

function buildFollowModal() {
  const modal = new ModalBuilder().setCustomId('modal_follow').setTitle('اتبع لاعب');
  const input = new TextInputBuilder()
    .setCustomId('username')
    .setLabel('اسم اللاعب المراد اتباعه')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

function buildGotoModal() {
  const modal = new ModalBuilder().setCustomId('modal_goto').setTitle('اذهب إلى إحداثيات');
  const x = new TextInputBuilder().setCustomId('x').setLabel('X').setStyle(TextInputStyle.Short).setRequired(true);
  const y = new TextInputBuilder().setCustomId('y').setLabel('Y').setStyle(TextInputStyle.Short).setRequired(true);
  const z = new TextInputBuilder().setCustomId('z').setLabel('Z').setStyle(TextInputStyle.Short).setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(x),
    new ActionRowBuilder().addComponents(y),
    new ActionRowBuilder().addComponents(z)
  );
  return modal;
}

function buildPullModal() {
  const modal = new ModalBuilder().setCustomId('modal_pull').setTitle('اسحب لاعب');
  const input = new TextInputBuilder()
    .setCustomId('username')
    .setLabel('اسم اللاعب المراد سحبه')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

function buildKickModal() {
  const modal = new ModalBuilder().setCustomId('modal_kick').setTitle('اطرد لاعب');
  const username = new TextInputBuilder()
    .setCustomId('username')
    .setLabel('اسم اللاعب المراد طرده')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('السبب (اختياري)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  modal.addComponents(
    new ActionRowBuilder().addComponents(username),
    new ActionRowBuilder().addComponents(reason)
  );
  return modal;
}

function buildBanModal() {
  const modal = new ModalBuilder().setCustomId('modal_ban').setTitle('احظر لاعب');
  const username = new TextInputBuilder()
    .setCustomId('username')
    .setLabel('اسم اللاعب المراد حظره')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('السبب (اختياري)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  modal.addComponents(
    new ActionRowBuilder().addComponents(username),
    new ActionRowBuilder().addComponents(reason)
  );
  return modal;
}

/* ==================== أدوات مساعدة للردود ==================== */

async function replyOk(interaction, content) {
  await interaction.reply({ content, ephemeral: true }).catch(() => {});
}

async function replyErr(interaction, err) {
  await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {});
}

function requireAdminOrReply(interaction) {
  if (!isAdmin(interaction)) {
    interaction.reply({ content: '⛔ لا تملك الصلاحية لاستخدام هذا الزر.', ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

/* ==================== معالجة تفاعلات الأزرار ==================== */

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  // ---------- الطقس ----------
  if (customId === 'panel_weather') {
    await interaction.update({ embeds: [buildWeatherPanelEmbed()], components: buildWeatherPanelRows() });
    return;
  }

  if (customId === 'panel_back') {
    await interaction.update({ embeds: [buildMainPanelEmbed()], components: buildMainPanelRows() });
    return;
  }

  if (customId.startsWith('weather_')) {
    if (!requireAdminOrReply(interaction)) return;
    const mode = customId.replace('weather_', '');
    try {
      let label;
      if (mode === 'day' || mode === 'night') {
        label = actions.setTime(botManager, mode);
      } else {
        label = actions.setWeather(botManager, mode);
      }
      await replyOk(interaction, `✅ تم تغيير حالة السيرفر إلى: **${label}**`);
    } catch (err) {
      await replyErr(interaction, err);
    }
    return;
  }

  // ---------- تحديث / معلومات ----------
  if (customId === 'panel_refresh') {
    await interaction.update({ embeds: [buildMainPanelEmbed()], components: buildMainPanelRows() });
    return;
  }

  if (customId === 'panel_players') {
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

  if (customId === 'panel_serverinfo') {
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
        { name: 'وقت التشغيل', value: uptimeSeconds ? formatDuration(uptimeSeconds) : '—', inline: true }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (customId === 'panel_coords') {
    try {
      const pos = actions.getCoordinates(botManager);
      const embed = new EmbedBuilder()
        .setTitle('📍 إحداثيات البوت')
        .setColor(0x1abc9c)
        .addFields(
          { name: 'X', value: `${pos.x}`, inline: true },
          { name: 'Y', value: `${pos.y}`, inline: true },
          { name: 'Z', value: `${pos.z}`, inline: true },
          { name: 'البُعد (Dimension)', value: `${pos.dimension}`, inline: false }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      await replyErr(interaction, err);
    }
    return;
  }

  if (customId === 'panel_reconnect') {
    if (!requireAdminOrReply(interaction)) return;
    botManager.manualReconnect();
    await replyOk(interaction, '🔄 تم إرسال طلب إعادة الاتصال، البوت سيعيد الاتصال خلال لحظات.');
    return;
  }

  // ---------- حركة وسلوك ----------
  if (customId === 'panel_jump') {
    try {
      actions.jump(botManager);
      await replyOk(interaction, '🦘 قفز البوت!');
    } catch (err) {
      await replyErr(interaction, err);
    }
    return;
  }

  if (customId === 'panel_sleep') {
    await interaction.deferReply({ ephemeral: true });
    try {
      await actions.sleepNow(botManager);
      await interaction.editReply('😴 البوت نائم الآن.');
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }

  if (customId === 'panel_wake') {
    await interaction.deferReply({ ephemeral: true });
    try {
      await actions.wakeUp(botManager);
      await interaction.editReply('☀️ البوت استيقظ.');
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }

  if (customId === 'panel_stopfollow') {
    try {
      actions.stopFollow(botManager);
      await replyOk(interaction, '⏹️ تم إيقاف الاتباع.');
    } catch (err) {
      await replyErr(interaction, err);
    }
    return;
  }

  // ---------- أزرار تفتح Modal ----------
  if (customId === 'panel_follow') {
    await interaction.showModal(buildFollowModal());
    return;
  }

  if (customId === 'panel_goto') {
    await interaction.showModal(buildGotoModal());
    return;
  }

  if (customId === 'panel_pull') {
    if (!requireAdminOrReply(interaction)) return;
    await interaction.showModal(buildPullModal());
    return;
  }

  if (customId === 'panel_kick') {
    if (!requireAdminOrReply(interaction)) return;
    await interaction.showModal(buildKickModal());
    return;
  }

  if (customId === 'panel_ban') {
    if (!requireAdminOrReply(interaction)) return;
    await interaction.showModal(buildBanModal());
    return;
  }
}

/* ==================== معالجة إرسال Modals ==================== */

async function handleModalSubmit(interaction) {
  const { customId } = interaction;

  if (customId === 'modal_follow') {
    const username = interaction.fields.getTextInputValue('username').trim();
    await interaction.deferReply({ ephemeral: true });
    try {
      actions.followPlayer(botManager, username);
      await interaction.editReply(`✅ البوت بدأ يتبع اللاعب **${username}** الآن.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }

  if (customId === 'modal_goto') {
    const x = Number(interaction.fields.getTextInputValue('x'));
    const y = Number(interaction.fields.getTextInputValue('y'));
    const z = Number(interaction.fields.getTextInputValue('z'));
    if ([x, y, z].some((v) => Number.isNaN(v))) {
      await interaction.reply({ content: '❌ الإحداثيات يجب أن تكون أرقامًا صحيحة.', ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(`🚶 البوت يتحرك الآن إلى \`${x}, ${y}, ${z}\` ...`);
    try {
      await actions.goTo(botManager, x, y, z);
      await interaction.followUp({ content: `✅ وصل البوت إلى \`${x}, ${y}, ${z}\`.`, ephemeral: true });
    } catch (err) {
      await interaction.followUp({ content: `❌ تعذر الوصول: ${err.message}`, ephemeral: true });
    }
    return;
  }

  if (customId === 'modal_pull') {
    const username = interaction.fields.getTextInputValue('username').trim();
    await interaction.deferReply({ ephemeral: true });
    try {
      actions.pullPlayer(botManager, username);
      await interaction.editReply(`✅ تم إرسال أمر سحب **${username}** إلى موقع البوت.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }

  if (customId === 'modal_kick') {
    const username = interaction.fields.getTextInputValue('username').trim();
    const reason = interaction.fields.getTextInputValue('reason')?.trim() || null;
    await interaction.deferReply({ ephemeral: true });
    try {
      actions.kickPlayer(botManager, username, reason);
      await interaction.editReply(`✅ تم إرسال أمر طرد **${username}**${reason ? `\nالسبب: ${reason}` : ''}.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }

  if (customId === 'modal_ban') {
    const username = interaction.fields.getTextInputValue('username').trim();
    const reason = interaction.fields.getTextInputValue('reason')?.trim() || null;
    await interaction.deferReply({ ephemeral: true });
    try {
      actions.banPlayer(botManager, username, reason);
      await interaction.editReply(`✅ تم إرسال أمر حظر **${username}**${reason ? `\nالسبب: ${reason}` : ''}.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
    return;
  }
}

module.exports = {
  buildMainPanelEmbed,
  buildMainPanelRows,
  buildWeatherPanelEmbed,
  buildWeatherPanelRows,
  handleButtonInteraction,
  handleModalSubmit,
};
