const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const db = require('../database');
const formatNumber = require('../utils/formatNumber');
const calculateIncome = require('../utils/calculateIncome');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailyprofit')
    .setDescription('Calculate daily profit from your profile'),

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

    const incomePerSecond = calculateIncome(
      profile.boostedGasps,
      profile.price,
      profile.cashBoost
    );

    const hourly = incomePerSecond * 3600;
    const daily = hourly * 24;
    const weekly = daily * 7;

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('💰 Profit Statistics')

      .addFields(
        {
          name: '⛽ Boosted Gas/s',
          value:
            `${formatNumber(profile.boostedGasps)}/s`,
          inline: true
        },
        {
          name: '💲 Sell Price',
          value: `$${profile.price}`,
          inline: true
        },
        {
          name: '📈 Cash Boost',
          value: `${profile.cashBoost}%`,
          inline: true
        },
        {
          name: '💵 Income/s',
          value:
            `$${formatNumber(incomePerSecond)}/s`,
          inline: false
        },
        {
          name: '🕐 Hourly Profit',
          value:
            `$${formatNumber(hourly)}`,
          inline: true
        },
        {
          name: '📅 Daily Profit',
          value:
            `$${formatNumber(daily)}`,
          inline: true
        },
        {
          name: '🗓️ Weekly Profit',
          value:
            `$${formatNumber(weekly)}`,
          inline: true
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
