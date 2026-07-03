'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { buildMainPanelEmbed, buildMainPanelRows } = require('../handlers/controlPanelHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('لوحة_التحكم')
    .setDescription('يعرض لوحة تحكم كاملة بالبوت بالأزرار (اتبع، اذهب، الطقس، الإدارة، وأكثر)'),

  async execute(interaction) {
    await interaction.reply({ embeds: [buildMainPanelEmbed()], components: buildMainPanelRows() });
  },
};
