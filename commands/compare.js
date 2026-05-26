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
    .setName('compare')
    .setDescription('Compare two drills')

    .addStringOption(option =>
      option
        .setName('drill1')
        .setDescription('First drill')
        .setRequired(true)
        .setAutocomplete(true)
    )

    .addStringOption(option =>
      option
        .setName('drill2')
        .setDescription('Second drill')
        .setRequired(true)
        .setAutocomplete(true)
    )

    .addNumberOption(option =>
      option
        .setName('zone1')
        .setDescription('Zone multiplier for drill 1')
        .setRequired(true)
    )

    .addNumberOption(option =>
      option
        .setName('zone2')
        .setDescription('Zone multiplier for drill 2')
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

    const drill1Id =
      interaction.options.getString('drill1');

    const drill2Id =
      interaction.options.getString('drill2');

    const zone1 =
      interaction.options.getNumber('zone1');

    const zone2 =
      interaction.options.getNumber('zone2');

    const d1 = drills.find(
      d => d.id === drill1Id
    );

    const d2 = drills.find(
      d => d.id === drill2Id
    );

    if (!d1 || !d2) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    // Effective gas
    const gas1 = d1.gas * zone1;
    const gas2 = d2.gas * zone2;

    // Income/s
    const income1 = calculateIncome(
      gas1,
      profile.price,
      profile.cashBoost
    );

    const income2 = calculateIncome(
      gas2,
      profile.price,
      profile.cashBoost
    );

    // ROI
    const roi1 = d1.cost / income1;
    const roi2 = d2.cost / income2;

    // Recommendation
    let recommendation = d1.name;

    if (roi2 < roi1) {
      recommendation = d2.name;
    }

    const embed = new EmbedBuilder()
      .setColor('#e84393')
      .setTitle('⚔️ Drill Comparison')

      .addFields(
        {
          name: `⛽ ${d1.name}`,
          value:
            `💰 Cost: $${formatNumber(d1.cost)}\n` +
            `⛽ Gas/s: ${formatNumber(gas1)}/s\n` +
            `💵 Income/s: $${formatNumber(income1)}\n` +
            `⌛ ROI: ${formatTime(roi1)}`,
          inline: true
        },

        {
          name: `⛽ ${d2.name}`,
          value:
            `💰 Cost: $${formatNumber(d2.cost)}\n` +
            `⛽ Gas/s: ${formatNumber(gas2)}/s\n` +
            `💵 Income/s: $${formatNumber(income2)}\n` +
            `⌛ ROI: ${formatTime(roi2)}`,
          inline: true
        },

        {
          name: '🏆 Better ROI',
          value: recommendation,
          inline: false
        }
      )

      .setFooter({
        text: 'Oil Empire Comparison Tool'
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
