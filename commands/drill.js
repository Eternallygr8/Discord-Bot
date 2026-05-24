const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const drills = require('../data/drills.json');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drill')
    .setDescription('View drill information')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Drill name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const drillName = interaction.options.getString('name').toLowerCase();

    const drill = drills.find(d => d.id === drillName);

    if (!drill) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ffd000')
      .setTitle(`⛽ ${drill.name}`)
      .setDescription('Oil Empire Drill Information')
      .addFields(
        {
          name: '💰 Cost',
          value: `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '⛽ Gas/s',
          value: `${formatNumber(drill.gas)}/s`,
          inline: true
        },
        {
          name: '💎 Tier',
          value: `${drill.tier}`,
          inline: true
        },
        {
          name: '✨ Rarity',
          value: drill.rarity,
          inline: true
        }
      )
      .setFooter({
        text: 'Oil Empire Companion Bot'
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
