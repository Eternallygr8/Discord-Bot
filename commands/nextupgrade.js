const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const drills = require('../data/drills.json');
const db = require('../database');

const calculateIncome = require('../utils/calculateIncome');
const formatNumber = require('../utils/formatNumber');
const formatTime = require('../utils/formatTime');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nextupgrade')
    .setDescription('Recommend best next upgrade'),

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

    // Affordable drills
    const affordable = drills.filter(
      d => d.cost > profile.money
    );

    if (affordable.length === 0) {
      return interaction.reply({
        content:
          '🎉 You can already afford every drill.',
        ephemeral: true
      });
    }

    // Closest affordable
    affordable.sort(
      (a, b) => a.cost - b.cost
    );

    const nextDrill = affordable[0];

    // Current income/s
    const currentIncome = calculateIncome(
      profile.boostedGasps,
      profile.price,
      profile.cashBoost
    );

    // Remaining money
    const remaining =
      nextDrill.cost - profile.money;

    // Time needed
    const seconds =
      remaining / currentIncome;

    const embed = new EmbedBuilder()
      .setColor('#00cec9')
      .setTitle('🚀 Next Upgrade')

      .addFields(
        {
          name: '⛽ Recommended Drill',
          value: nextDrill.name,
          inline: true
        },

        {
          name: '💰 Cost',
          value:
            `$${formatNumber(nextDrill.cost)}`,
          inline: true
        },

        {
          name: '⛽ Gas/s',
          value:
            `${formatNumber(nextDrill.gas)}/s`,
          inline: true
        },

        {
          name: '💸 Remaining',
          value:
            `$${formatNumber(remaining)}`,
          inline: true
        },

        {
          name: '⌛ Estimated Time',
          value:
            formatTime(seconds),
          inline: true
        },

        {
          name: '✨ Rarity',
          value:
            nextDrill.rarity,
          inline: true
        }
      )

      .setFooter({
        text: 'Oil Empire Upgrade Planner'
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
