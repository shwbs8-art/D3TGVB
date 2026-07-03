'use strict';

const { Events } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');
const { handleSlashCommand } = require('../handlers/commandHandler');
const statsHandler = require('../handlers/statsHandler');
const controlPanelHandler = require('../handlers/controlPanelHandler');

function registerDiscordEvents(client) {
  client.once(Events.ClientReady, async () => {
    logger.info('discord', `تم تسجيل الدخول إلى Discord باسم ${client.user.tag}`);
    client.user.setActivity('🇮🇶 Iraq Babylon SMP');

    await statsHandler.initStatsMessage(client);
    statsHandler.startAutoUpdate(client);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        logger.debug('discord', `تم استلام أمر /${interaction.commandName} من ${interaction.user.tag}`);
        await handleSlashCommand(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('stats_')) {
        await statsHandler.handleButtonInteraction(interaction);
        return;
      }

      if (
        interaction.isButton() &&
        (interaction.customId.startsWith('panel_') || interaction.customId.startsWith('weather_'))
      ) {
        await controlPanelHandler.handleButtonInteraction(interaction);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await controlPanelHandler.handleModalSubmit(interaction);
      }
    } catch (err) {
      logger.error('error', `خطأ أثناء معالجة تفاعل Discord (${interaction.customId || interaction.commandName}): ${err.stack || err.message}`);

      // شبكة أمان: إن لم يتم الرد على التفاعل إطلاقًا بسبب الخطأ، نرسل رسالة بدل ترك
      // Discord يعرض "This interaction failed" بصمت للمستخدم.
      const payload = { content: `❌ حدث خطأ غير متوقع: ${err.message}`, ephemeral: true };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(payload);
        } else if (typeof interaction.reply === 'function') {
          await interaction.reply(payload);
        }
      } catch (replyErr) {
        logger.error('error', `تعذر إرسال رسالة الخطأ الاحتياطية: ${replyErr.message}`);
      }
    }
  });

  client.on(Events.Error, (err) => {
    logger.error('error', `خطأ في اتصال Discord: ${err.message}`);
  });
}

module.exports = { registerDiscordEvents };
