'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');

const COLORS = {
  join: 0x2ecc71,
  leave: 0xe67e22,
  death: 0x992d22,
  serverUp: 0x1abc9c,
  serverDown: 0xe74c3c,
  serverRestart: 0xf1c40f,
  botConnected: 0x3498db,
  botDisconnected: 0xe74c3c,
  botReconnecting: 0xf39c12,
};

async function getNotificationsChannel(client) {
  const channelId = config.discord.notificationsChannelId;
  if (!channelId) return null;
  try {
    return await client.channels.fetch(channelId);
  } catch (err) {
    logger.error('error', `تعذر الوصول لروم الإشعارات: ${err.message}`);
    return null;
  }
}

async function sendNotification(client, { title, description, color, emoji }) {
  const channel = await getNotificationsChannel(client);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`${emoji ? emoji + ' ' : ''}${title}`)
    .setDescription(description || null)
    .setColor(color || 0x95a5a6)
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error('error', `فشل إرسال إشعار Discord: ${err.message}`);
  }
}

module.exports = {
  playerJoined: (client, username) =>
    sendNotification(client, { title: 'دخول لاعب', description: `**${username}** دخل السيرفر`, color: COLORS.join, emoji: '🟢' }),

  playerLeft: (client, username) =>
    sendNotification(client, { title: 'خروج لاعب', description: `**${username}** غادر السيرفر`, color: COLORS.leave, emoji: '🔴' }),

  playerDeath: (client, username, cause) =>
    sendNotification(client, {
      title: 'موت لاعب',
      description: `**${username}** مات${cause ? ` (${cause})` : ''}`,
      color: COLORS.death,
      emoji: '💀',
    }),

  serverUp: (client) =>
    sendNotification(client, { title: 'تشغيل السيرفر', description: 'السيرفر أصبح متصلاً الآن', color: COLORS.serverUp, emoji: '🟢' }),

  serverDown: (client) =>
    sendNotification(client, { title: 'توقف السيرفر', description: 'السيرفر أصبح غير متصل', color: COLORS.serverDown, emoji: '🔴' }),

  serverRestarted: (client) =>
    sendNotification(client, { title: 'إعادة تشغيل السيرفر', description: 'تم رصد إعادة تشغيل للسيرفر', color: COLORS.serverRestart, emoji: '🔄' }),

  botConnected: (client) =>
    sendNotification(client, { title: 'اتصال البوت', description: 'اتصل البوت بالسيرفر بنجاح', color: COLORS.botConnected, emoji: '🤖' }),

  botDisconnected: (client, reason) =>
    sendNotification(client, {
      title: 'انقطاع البوت',
      description: `انقطع اتصال البوت بالسيرفر${reason ? `\nالسبب: \`${reason}\`` : ''}`,
      color: COLORS.botDisconnected,
      emoji: '⚠️',
    }),

  botReconnecting: (client, attempt) =>
    sendNotification(client, {
      title: 'إعادة الاتصال',
      description: `جارٍ محاولة إعادة الاتصال (محاولة رقم ${attempt})...`,
      color: COLORS.botReconnecting,
      emoji: '🔁',
    }),
};
