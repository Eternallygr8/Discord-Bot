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

    if (
