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
    )

    .addStringOption(option =>
      option
        .setName('money')
        .setDescription('Current money')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('income')
        .setDescription('Income per second')
        .setRequired(true)
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

    const income = parseNumber(
      interaction.options.getString('income')
    );

    const remaining = Math.max(drill.cost - money, 0);

    const seconds = remaining / income;

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
          name: '💰 Cost',
          value: `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '💵 Current Money',
          value: `$${formatNumber(money)}`,
          inline: true
        },
        {
          name: '📈 Income/s',
          value: `$${formatNumber(income)}/s`,
          inline: true
        },
        {
          name: '⌛ Time Remaining',
          value: `${hours}h ${minutes}m`,
          inline: false
        }
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
