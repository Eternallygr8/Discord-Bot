const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Calculate oil sell value')
    .addNumberOption(option =>
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
    const amount = interaction.options.getNumber('amount');
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
