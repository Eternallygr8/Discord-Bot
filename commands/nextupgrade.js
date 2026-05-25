const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const drills = require('../data/drills.json');
const parseNumber = require('../utils/parseNumber');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nextupgrade')
    .setDescription('Recommend best affordable drill')

    .addStringOption(option =>
      option
        .setName('money')
        .setDescription('Current money')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('currentdrill')
        .setDescription('Your current best drill')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const money = parseNumber(
      interaction.options.getString('money')
    );

    const currentDrillId =
      interaction.options.getString('currentdrill');

    if (isNaN(money)) {
      return interaction.reply({
        content: '❌ Invalid money format.',
        ephemeral: true
      });
    }

    // Affordable drills
    let affordable = drills.filter(
      d => d.cost <= money
    );

    // Remove current/lower drills if selected
    if (currentDrillId) {
      const currentDrill = drills.find(
        d => d.id === currentDrillId
      );

      if (currentDrill) {
        affordable = affordable.filter(
          d => d.tier > currentDrill.tier
        );
      }
    }

    if (affordable.length === 0) {
      return interaction.reply({
        content: '❌ No upgrade available.',
        ephemeral: true
      });
    }

    // Highest tier affordable
    const bestDrill = affordable.sort(
      (a, b) => b.tier - a.tier
    )[0];

    // Find next target drill
    const nextTarget = drills.find(
      d => d.tier === bestDrill.tier + 1
    );

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('🚀 Next Upgrade Recommendation')
      .addFields(
        {
          name: '💰 Current Money',
          value: `$${formatNumber(money)}`,
          inline: true
        },
        {
          name: '⛽ Recommended Drill',
          value: bestDrill.name,
          inline: true
        },
        {
          name: '✨ Rarity',
          value: bestDrill.rarity,
          inline: true
        },
        {
          name: '💸 Cost',
          value: `$${formatNumber(bestDrill.cost)}`,
          inline: true
        },
        {
          name: '⛽ Gas/s',
          value: `${formatNumber(bestDrill.gas)}/s`,
          inline: true
        }
      );

    if (nextTarget) {
      embed.addFields({
        name: '🎯 Next Major Goal',
        value:
          `${nextTarget.name}\n` +
          `💰 $${formatNumber(nextTarget.cost)}`,
        inline: false
      });
    }

    embed.setFooter({
      text: 'Oil Empire Upgrade Assistant'
    });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
