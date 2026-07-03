'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إعادة_الاتصال')
    .setDescription('يجبر البوت على إعادة الاتصال بسيرفر Minecraft فورًا'),
  adminOnly: true,

  async execute(interaction) {
    await interaction.deferReply();
    botManager.manualReconnect();
    await interaction.editReply('🔄 تم إرسال طلب إعادة الاتصال، البوت سيعيد الاتصال خلال لحظات.');
  },
};
