'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('احظر')
    .setDescription('يحظر لاعبًا من السيرفر (يتطلب صلاحيات Operator للبوت)')
    .addStringOption((o) =>
      o.setName('اللاعب').setDescription('اسم اللاعب المراد حظره').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('السبب').setDescription('سبب الحظر (اختياري)').setRequired(false)
    ),
  adminOnly: true,

  async execute(interaction) {
    const username = interaction.options.getString('اللاعب');
    const reason = interaction.options.getString('السبب');
    await interaction.deferReply();
    try {
      actions.banPlayer(botManager, username, reason);
      await interaction.editReply(`✅ تم إرسال أمر حظر **${username}**${reason ? `\nالسبب: ${reason}` : ''}.`);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
  },
};
