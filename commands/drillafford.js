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
    .setName('drillafford')
    .setDescription('Calculate time until you can afford a drill')

    .addStringOption(option =>
      option
        .setName('drill')
        .setDescription('Drill name')
        .setRequired(true)
        .setAutocomplete(true)
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

    const drill = drills.find(
      d => d.id === drillId
    );

    if (!drill) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    const incomePerSecond = calculateIncome(
      profile.boostedGasps,
      profile.price,
      profile.cashBoost
    );

    const remaining =
      Math.max(drill.cost - profile.money, 0);

    const seconds =
      remaining / incomePerSecond;

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle(`⛽ ${drill.name}`)

      .addFields(
        {
          name: '💰 Drill Cost',
          value:
            `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '💵 Current Money',
          value:
            `$${formatNumber(profile.money)}`,
          inline: true
        },
        {
          name: '💸 Remaining',
          value:
            `$${formatNumber(remaining)}`,
          inline: true
        },
        {
          name: '📈 Income/s',
          value:
            `$${formatNumber(incomePerSecond)}/s`,
          inline: true
        },
        {
          name: '⌛ Time Needed',
          value:
            formatTime(seconds),
          inline: false
        }
      )

      .setFooter({
        text: 'Oil Empire Affordability Calculator'
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
