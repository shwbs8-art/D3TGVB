'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (!command?.data || !command?.execute) {
        logger.warn('discord', `تم تجاهل ملف أمر غير صالح: ${file}`);
        continue;
      }
      client.commands.set(command.data.name, command);
    } catch (err) {
      logger.error('error', `فشل تحميل ملف الأمر ${file}: ${err.message}`);
    }
  }

  logger.info('discord', `تم تحميل ${client.commands.size} أمر Discord بنجاح`);
}

function getCommandsJSON(client) {
  return [...client.commands.values()].map((cmd) => cmd.data.toJSON());
}

async function handleSlashCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'هذا الأمر غير موجود.', ephemeral: true });
    return;
  }

  if (command.adminOnly && config.discord.adminRoleId) {
    const hasRole = interaction.member?.roles?.cache?.has(config.discord.adminRoleId);
    if (!hasRole) {
      await interaction.reply({ content: '⛔ لا تملك الصلاحية لاستخدام هذا الأمر.', ephemeral: true });
      return;
    }
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('error', `خطأ أثناء تنفيذ الأمر /${interaction.commandName}: ${err.message}`);
    const payload = { content: `❌ حدث خطأ: ${err.message}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
}

module.exports = { loadCommands, getCommandsJSON, handleSlashCommand };
