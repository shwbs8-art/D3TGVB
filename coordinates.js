'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('الإحداثيات')
    .setDescription('عرض إحداثيات البوت الحالية داخل اللعبة'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const pos = actions.getCoordinates(botManager);
      const embed = new EmbedBuilder()
        .setTitle('📍 إحداثيات البوت')
        .setColor(0x1abc9c)
        .addFields(
          { name: 'X', value: `${pos.x}`, inline: true },
          { name: 'Y', value: `${pos.y}`, inline: true },
          { name: 'Z', value: `${pos.z}`, inline: true },
          { name: 'البُعد (Dimension)', value: `${pos.dimension}`, inline: false }
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
    }
  },
};
