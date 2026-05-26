const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const db = require('../database');

const parseNumber = require('../utils/parseNumber');
const formatNumber = require('../utils/formatNumber');
const calculateIncome = require('../utils/calculateIncome');
const formatTime = require('../utils/formatTime');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeto')
    .setDescription('Calculate time needed to reach target money')

    .addStringOption(option =>
      option
        .setName('target')
        .setDescription('Target money')
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

    const target = parseNumber(
      interaction.options.getString('target')
    );

    if (isNaN(target)) {
      return interaction.reply({
        content: '❌ Invalid target format.',
        ephemeral: true
      });
    }

    const incomePerSecond = calculateIncome(
      profile.boostedGasps,
      profile.price,
      profile.cashBoost
    );

    const remaining =
      Math.max(target - profile.money, 0);

    const seconds =
      remaining / incomePerSecond;

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('⏳ Time To Target')

      .addFields(
        {
          name: '🎯 Target',
          value:
            `$${formatNumber(target)}`,
          inline: true
        },
        {
          name: '💰 Current Money',
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
          name: '💵 Income/s',
          value:
            `$${formatNumber(incomePerSecond)}/s`,
          inline: true
        },
        {
          name: '⌛ Estimated Time',
          value:
            formatTime(seconds),
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
