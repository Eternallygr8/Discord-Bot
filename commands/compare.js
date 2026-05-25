const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const drills = require('../data/drills.json');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('compare')
    .setDescription('Compare two drills')

    .addStringOption(option =>
      option
        .setName('drill1')
        .setDescription('First drill')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('drill2')
        .setDescription('Second drill')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const d1 = drills.find(
      d => d.id === interaction.options.getString('drill1').toLowerCase()
    );

    const d2 = drills.find(
      d => d.id === interaction.options.getString('drill2').toLowerCase()
    );

    if (!d1 || !d2) {
      return interaction.reply({
        content: '❌ One or both drills not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff00aa')
      .setTitle('⚔️ Drill Comparison')
      .addFields(
        {
          name: d1.name,
          value:
            `💰 Cost: $${formatNumber(d1.cost)}\n` +
            `⛽ Gas/s: ${formatNumber(d1.gas)}/s`,
          inline: true
        },
        {
          name: d2.name,
          value:
            `💰 Cost: $${formatNumber(d2.cost)}\n` +
            `⛽ Gas/s: ${formatNumber(d2.gas)}/s`,
          inline: true
        }
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
