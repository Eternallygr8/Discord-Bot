const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const drills = require('../data/drills.json');
const parseNumber = require('../utils/parseNumber');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drillafford')
    .setDescription('Calculate time needed to afford a drill')

    .addStringOption(option =>
      option
        .setName('drill')
        .setDescription('Drill name')
        .setRequired(true)
        .setAutocomplete(true)
    )

    .addStringOption(option =>
      option
        .setName('money')
        .setDescription('Current money')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('oilps')
        .setDescription('Oil/Gas per second')
        .setRequired(true)
    )

    .addNumberOption(option =>
      option
        .setName('price')
        .setDescription('Sell price')
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

    const money = parseNumber(
      interaction.options.getString('money')
    );

    const oilps = parseNumber(
      interaction.options.getString('oilps')
    );

    if (isNaN(money) || isNaN(oilps)) {
      return interaction.reply({
        content: '❌ Invalid number format.',
        ephemeral: true
      });
    }

    const price = interaction.options.getNumber('price');
    const boost = interaction.options.getNumber('boost') || 0;

    // Money income per second
    const incomePerSecond =
      oilps * price * (1 + boost / 100);

    // Remaining money needed
    const remaining = Math.max(drill.cost - money, 0);

    // Time calculation
    const seconds = remaining / incomePerSecond;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor('#00bfff')
      .setTitle('⏳ Drill Afford Calculator')
      .addFields(
        {
          name: '⛽ Drill',
          value: drill.name,
          inline: true
        },
        {
          name: '💰 Drill Cost',
          value: `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '💵 Current Money',
          value: `$${formatNumber(money)}`,
          inline: true
        },
        {
          name: '⛽ Oil/s',
          value: `${formatNumber(oilps)}/s`,
          inline: true
        },
        {
          name: '💲 Sell Price',
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
          name: '⌛ Time Remaining',
          value: `${hours}h ${minutes}m`,
          inline: false
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
