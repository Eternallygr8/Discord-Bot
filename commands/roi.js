const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const drills = require('../data/drills.json');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roi')
    .setDescription('Calculate ROI/payback time for a drill')

    .addStringOption(option =>
      option
        .setName('drill')
        .setDescription('Drill name')
        .setRequired(true)
        .addChoices(
      { name: 'Diamond Drill', value: 'diamond' },
      { name: 'Ruby Drill', value: 'ruby' },
      { name: 'Fusion Drill', value: 'fusion' },
      { name: 'Uranium Drill', value: 'uranium' },
      { name: 'Radium Drill', value: 'radium' },
      { name: 'Palladium Drill', value: 'palladium' },
      { name: 'Thorium Drill', value: 'thorium' }
    )
    )

    .addNumberOption(option =>
      option
        .setName('zone_multiplier')
        .setDescription('Zone multiplier')
        .setRequired(true)
    )

    .addNumberOption(option =>
      option
        .setName('price')
        .setDescription('Gas sell price')
        .setRequired(true)
    )

    .addNumberOption(option =>
      option
        .setName('boost')
        .setDescription('Cash boost %')
        .setRequired(false)
    ),

  async execute(interaction) {
    const drillName = interaction.options.getString('drill').toLowerCase();

    const drill = drills.find(d => d.id === drillName);

    if (!drill) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    const zone = interaction.options.getNumber('zone');
    const price = interaction.options.getNumber('price');
    const boost = interaction.options.getNumber('boost') || 0;

    // Adjusted gas with zone multiplier
    const adjustedGas = drill.gas * zone;

    // Income per second
    const incomePerSecond =
      adjustedGas * price * (1 + boost / 100);

    // ROI seconds
    const roiSeconds = drill.cost / incomePerSecond;

    // Time formatting
    const hours = Math.floor(roiSeconds / 3600);
    const minutes = Math.floor((roiSeconds % 3600) / 60);
    const seconds = Math.floor(roiSeconds % 60);

    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('📈 ROI Calculator')
      .addFields(
        {
          name: '⛽ Drill',
          value: drill.name,
          inline: true
        },
        {
          name: '🌍 Zone',
          value: `${zone}x`,
          inline: true
        },
        {
          name: '💰 Cost',
          value: `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '⛽ Effective Gas/s',
          value: `${formatNumber(adjustedGas)}/s`,
          inline: true
        },
        {
          name: '💵 Price',
          value: `$${price}`,
          inline: true
        },
        {
          name: '📈 Boost',
          value: `${boost}%`,
          inline: true
        },
        {
          name: '💸 Income/s',
          value: `$${formatNumber(incomePerSecond)}/s`,
          inline: false
        },
        {
          name: '⏳ ROI Time',
          value: `${hours}h ${minutes}m ${seconds}s`,
          inline: false
        }
      )
      .setFooter({
        text: 'Oil Empire ROI Calculator'
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
