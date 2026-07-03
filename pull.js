'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اسحب')
    .setDescription('يسحب لاعبًا إلى موقع البوت (يتطلب صلاحيات Operator للبوت)')
    .addStringOption((o) =>
      o.setName('اللاعب').setDescription('اسم اللاعب المراد سحبه').setRequired(true)
    ),
  adminOnly: true,

  async execute(interaction) {
    const username = interaction.options.getString('اللاعب');
    await interaction.deferReply();
    try {
      actions.pullPlayer(botManager, username);
      await interaction.editReply(`✅ تم إرسال أمر سحب **${username}** إلى موقع البوت.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
  },
};
