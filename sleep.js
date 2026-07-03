'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('نم')
    .setDescription('يجعل البوت ينام في أقرب سرير متاح'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      await actions.sleepNow(botManager);
      await interaction.editReply('😴 البوت نائم الآن.');
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
  },
};
