'use strict';

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

async function deploy() {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
  const commands = commandFiles.map((file) => require(path.join(commandsPath, file)).data.toJSON());

  if (!config.discord.token || !config.discord.clientId) {
    console.error('❌ يجب تعيين DISCORD_TOKEN و DISCORD_CLIENT_ID في ملف .env قبل نشر الأوامر.');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log(`جارٍ نشر ${commands.length} أمر Slash...`);

    let route;
    if (config.discord.guildId) {
      route = Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId);
      console.log('سيتم النشر على السيرفر المحدد فقط (تحديث فوري).');
    } else {
      route = Routes.applicationCommands(config.discord.clientId);
      console.log('سيتم النشر عالميًا (قد يستغرق حتى ساعة للظهور).');
    }

    await rest.put(route, { body: commands });
    console.log('✅ تم نشر جميع الأوامر بنجاح.');
  } catch (err) {
    console.error('❌ فشل نشر الأوامر:', err);
    process.exit(1);
  }
}

deploy();
