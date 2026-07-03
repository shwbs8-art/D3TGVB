'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اتبع')
    .setDescription('يجعل البوت يتبع لاعبًا محددًا')
    .addStringOption((option) =>
      option.setName('اللاعب').setDescription('اسم اللاعب المراد اتباعه').setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('اللاعب');
    await interaction.deferReply();

    actions.followPlayer(botManager, username);
    await interaction.editReply(`✅ البوت بدأ يتبع اللاعب **${username}** الآن.`);
  },
};
