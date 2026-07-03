'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إيقاف_الاتباع')
    .setDescription('يوقف البوت عن اتباع أي لاعب'),

  async execute(interaction) {
    await interaction.deferReply();
    actions.stopFollow(botManager);
    await interaction.editReply('⏹️ تم إيقاف الاتباع.');
  },
};
