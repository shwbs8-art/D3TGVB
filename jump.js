'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اقفز')
    .setDescription('يجعل البوت يقفز مرة واحدة'),

  async execute(interaction) {
    try {
      actions.jump(botManager);
      await interaction.reply('🦘 قفز البوت!');
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};
