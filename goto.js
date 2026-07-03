'use strict';

const { SlashCommandBuilder } = require('discord.js');
const botManager = require('../minecraft/BotManager');
const actions = require('../minecraft/actions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اذهب')
    .setDescription('يرسل البوت إلى إحداثيات محددة')
    .addIntegerOption((o) => o.setName('x').setDescription('إحداثي X').setRequired(true))
    .addIntegerOption((o) => o.setName('y').setDescription('إحداثي Y').setRequired(true))
    .addIntegerOption((o) => o.setName('z').setDescription('إحداثي Z').setRequired(true)),

  async execute(interaction) {
    const x = interaction.options.getInteger('x');
    const y = interaction.options.getInteger('y');
    const z = interaction.options.getInteger('z');

    await interaction.deferReply();
    await interaction.editReply(`🚶 البوت يتحرك الآن إلى \`${x}, ${y}, ${z}\` ...`);

    try {
      await actions.goTo(botManager, x, y, z);
      await interaction.followUp(`✅ وصل البوت إلى \`${x}, ${y}, ${z}\`.`);
    } catch (err) {
      await interaction.followUp(`❌ تعذر الوصول: ${err.message}`);
    }
  },
};
