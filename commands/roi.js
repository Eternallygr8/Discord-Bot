const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const drills = require('../data/drills.json');
const db = require('../database');

const formatNumber = require('../utils/formatNumber');
const calculateIncome = require('../utils/calculateIncome');
const formatTime = require('../utils/formatTime');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roi')
    .setDescription('Calculate drill ROI')

    .addStringOption(option =>
      option
        .setName('drill')
        .setDescription('Drill name')
        .setRequired(true)
        .setAutocomplete(true)
    )

    .addNumberOption(option =>
      option
        .setName('zone')
        .setDescription('Zone multiplier')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    const profile = db.prepare(`
      SELECT * FROM profiles
      WHERE userId = ?
    `).get(userId);

    if (!profile) {
      return interaction.reply({
        content:
          '❌ No profile found. Use /profile set first.',
        ephemeral: true
      });
    }

    const drillId =
      interaction.options.getString('drill');

    const zone =
      interaction.options.getNumber('zone');

    const drill = drills.find(
      d => d.id === drillId
    );

    if (!drill) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    const boostedGas =
      drill.gas * zone;

    const incomePerSecond = calculateIncome(
      boostedGas,
      profile.price,
      profile.cashBoost
    );

    const roiSeconds =
      drill.cost / incomePerSecond;

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle(`📈 ${drill.name} ROI`)

      .addFields(
        {
          name: '💰 Cost',
          value:
            `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '⛽ Effective Gas/s',
          value:
            `${formatNumber(boostedGas)}/s`,
          inline: true
        },
        {
          name: '📍 Zone Multiplier',
          value: `${zone}x`,
          inline: true
        },
        {
          name: '💵 Income/s',
          value:
            `$${formatNumber(incomePerSecond)}/s`,
          inline: true
        },
        {
          name: '⌛ ROI Time',
          value:
            formatTime(roiSeconds),
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
