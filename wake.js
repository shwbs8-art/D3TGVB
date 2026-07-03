'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('استيقظ')
    .setDescription('يجعل البوت يستيقظ من النوم'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      await actions.wakeUp(botManager);
      await interaction.editReply('☀️ البوت استيقظ.');
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
  },
};
