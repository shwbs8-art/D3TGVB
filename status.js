'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { buildStatsEmbed, buildButtons } = require('../handlers/statsHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('حالة_السيرفر')
    .setDescription('عرض حالة سيرفر Iraq Babylon الحالية'),

  async execute(interaction) {
    await interaction.deferReply();
    const embed = await buildStatsEmbed();
    await interaction.editReply({ embeds: [embed], components: [buildButtons()] });
  },
};
