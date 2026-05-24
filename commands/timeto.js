const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const parseNumber = require('../utils/parseNumber');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeto')
    .setDescription('Calculate time needed to reach target money')

    .addStringOption(option =>
      option
        .setName('target')
        .setDescription('Target money')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('current')
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
    const target = parseNumber(
      interaction.options.getString('target')
    );

    const current = parseNumber(
      interaction.options.getString('current')
    );

    const oilps = parseNumber(
      interaction.options.getString('oilps')
    );

    if (
      isNaN(target) ||
      isNaN(current) ||
      isNaN(oilps)
    ) {
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
    const remaining = Math.max(target - current, 0);

    // Time calculation
    const seconds = remaining / incomePerSecond;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('⏳ Time To Target')
      .addFields(
        {
          name: '🎯 Target',
          value: `$${formatNumber(target)}`,
          inline: true
        },
        {
          name: '💰 Current',
          value: `$${formatNumber(current)}`,
          inline: true
        },
        {
          name: '💸 Remaining',
          value: `$${formatNumber(remaining)}`,
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
          name: '💵 Income/s',
          value: `$${formatNumber(incomePerSecond)}/s`,
          inline: false
        },
        {
          name: '⌛ Time Remaining',
          value: `${hours}h ${minutes}m ${secs}s`,
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
