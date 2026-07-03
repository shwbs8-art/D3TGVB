'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');
const { getServerStatus } = require('../services/statusService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اللاعبون')
    .setDescription('عرض اللاعبين المتصلين حاليًا بالسيرفر'),

  async execute(interaction) {
    await interaction.deferReply();

    let players = [];
    try {
      players = actions.getPlayerList(botManager);
    } catch {
      const server = await getServerStatus();
      players = server.playerSample;
    }

    const embed = new EmbedBuilder()
      .setTitle('👥 اللاعبون المتصلون حاليًا')
      .setColor(0x3498db)
      .setDescription(players.length ? players.map((p) => `• ${p}`).join('\n') : 'لا يوجد لاعبون متصلون حاليًا')
      .setFooter({ text: `العدد: ${players.length}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
