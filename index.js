'use strict';

const config = require('./config');
const logger = require('./utils/logger');
const client = require('./handlers/discordClient');
const { loadCommands } = require('./handlers/commandHandler');
const { registerDiscordEvents } = require('./events/discordEvents');
const { registerMinecraftEvents } = require('./events/minecraftEvents');
const botManager = require('./minecraft/BotManager');

function validateEnv() {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ متغيرات بيئة ناقصة في .env: ${missing.join(', ')}`);
    console.error('   انسخ .env.example إلى .env واملأ القيم المطلوبة قبل التشغيل.');
    process.exit(1);
  }
}

async function main() {
  validateEnv();

  console.log('==================================================');
  console.log('🇮🇶  Iraq Babylon Minecraft Bot — جارٍ بدء التشغيل');
  console.log('==================================================');

  loadCommands(client);
  registerDiscordEvents(client);
  registerMinecraftEvents(client);

  process.on('unhandledRejection', (err) => {
    logger.error('error', `Unhandled Rejection: ${err?.message || err}`);
  });

  process.on('uncaughtException', (err) => {
    logger.error('error', `Uncaught Exception: ${err?.message || err}`);
  });

  process.on('SIGINT', () => {
    logger.info('general', 'تم استلام إشارة إيقاف (SIGINT)، جارٍ إغلاق البوت بأمان...');
    process.exit(0);
  });

  await client.login(config.discord.token);
  botManager.connect();
}

main().catch((err) => {
  console.error('❌ فشل تشغيل المشروع:', err);
  process.exit(1);
});
