'use strict';

require('dotenv').config();

/**
 * الإعدادات المركزية للمشروع
 * يتم تحميل كل القيم من ملف .env مع قيم افتراضية آمنة
 */
const config = {
  minecraft: {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565', 10),
    username: process.env.MC_USERNAME || 'IraqBabylonBot',
    password: process.env.MC_PASSWORD || '',
    version: process.env.MC_VERSION || false,
    auth: process.env.MC_AUTH || 'offline',
    autoRegister: (process.env.MC_AUTO_REGISTER || 'true') === 'true',
    autoLogin: (process.env.MC_AUTO_LOGIN || 'true') === 'true',
    registerCommand: process.env.MC_REGISTER_COMMAND || '/register {password} {password}',
    loginCommand: process.env.MC_LOGIN_COMMAND || '/login {password}',
  },

  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    statsChannelId: process.env.DISCORD_STATS_CHANNEL_ID,
    notificationsChannelId: process.env.DISCORD_NOTIFICATIONS_CHANNEL_ID,
    logsChannelId: process.env.DISCORD_LOGS_CHANNEL_ID,
    adminRoleId: process.env.DISCORD_ADMIN_ROLE_ID || null,
  },

  bot: {
    reconnectDelaySeconds: parseInt(process.env.RECONNECT_DELAY || '10', 10),
    statsUpdateIntervalMinutes: parseInt(process.env.STATS_UPDATE_INTERVAL_MINUTES || '5', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  serverName: '🇮🇶 Iraq Babylon SMP',
};

module.exports = config;
