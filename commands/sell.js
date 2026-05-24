const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const formatNumber = require('../utils/formatNumber');
const parseNumber = require('../utils/parseNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Calculate oil sell value')

    .addStringOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of oil/gas')
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
    const amountInput = interaction.options.getString('amount');
    const amount = parseNumber(amountInput);

    if (isNaN(amount)) {
      return interaction.reply({
        content: '❌ Invalid amount format.',
        ephemeral: true
      });
    }

    const price = interaction.options.getNumber('price');
    const boost = interaction.options.getNumber('boost') || 0;

    const baseValue = amount * price;
    const bonus = baseValue * (boost / 100);
    const total = baseValue + bonus;

    const embed = new EmbedBuilder()
      .setColor('#00ff88')
      .setTitle('💰 Sell Calculator')
      .addFields(
        {
          name: '⛽ Amount',
          value: formatNumber(amount),
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
          name: '💸 Base Value',
          value: `$${formatNumber(baseValue)}`,
          inline: false
        },
        {
          name: '✨ Bonus',
          value: `$${formatNumber(bonus)}`,
          inline: false
        },
        {
          name: '🏆 Final Total',
          value: `$${formatNumber(total)}`,
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
