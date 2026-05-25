const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const db = require('../database');
const parseNumber = require('../utils/parseNumber');
const formatNumber = require('../utils/formatNumber');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Manage your Oil Empire profile')

    // --------------------
    // SET
    // --------------------

    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set your profile')

        .addStringOption(option =>
          option
            .setName('money')
            .setDescription('Current money')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option
            .setName('cash_boost')
            .setDescription('Cash boost %')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option
            .setName('offline_gas_boost')
            .setDescription('Offline gas boost %')
            .setRequired(true)
        )

        .addStringOption(option =>
          option
            .setName('gas_per_second')
            .setDescription('Base gas per second')
            .setRequired(true)
        )

        .addStringOption(option =>
          option
            .setName('boosted_gas_per_second')
            .setDescription('Boosted gas per second')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option
            .setName('price')
            .setDescription('Sell price')
            .setRequired(true)
        )
    )

    // --------------------
    // VIEW
    // --------------------

    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your profile')
    )

    // --------------------
    // DELETE
    // --------------------

    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete your profile')
    ),

  async execute(interaction) {
    const subcommand =
      interaction.options.getSubcommand();

    const userId = interaction.user.id;

    // --------------------
    // PROFILE SET
    // --------------------

    if (subcommand === 'set') {
      const money = parseNumber(
        interaction.options.getString('money')
      );

      const gasps = parseNumber(
        interaction.options.getString('gas_per_second')
      );

      const boostedGasps = parseNumber(
        interaction.options.getString(
          'boosted_gas_per_second'
        )
      );

      const cashBoost =
        interaction.options.getNumber('cash_boost');

      const offlineGasBoost =
        interaction.options.getNumber(
          'offline_gas_boost'
        );

      const price =
        interaction.options.getNumber('price');

      if (
        isNaN(money) ||
        isNaN(gasps) ||
        isNaN(boostedGasps)
      ) {
        return interaction.reply({
          content: '❌ Invalid number format.',
          ephemeral: true
        });
      }

      db.prepare(`
        INSERT OR REPLACE INTO profiles
        (
          userId,
          money,
          gasps,
          boostedGasps,
          cashBoost,
          offlineGasBoost,
          price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        money,
        gasps,
        boostedGasps,
        cashBoost,
        offlineGasBoost,
        price
      );

      return interaction.reply({
        content: '✅ Profile updated successfully.'
      });
    }

    // --------------------
    // PROFILE VIEW
    // --------------------

    if (subcommand === 'view') {
      const profile = db.prepare(`
        SELECT * FROM profiles
        WHERE userId = ?
      `).get(userId);

      if (!profile) {
        return interaction.reply({
          content: '❌ No profile found.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📊 Your Oil Empire Profile')
        .addFields(
          {
            name: '💰 Money',
            value: `$${formatNumber(profile.money)}`,
            inline: true
          },
          {
            name: '📈 Cash Boost',
            value: `${profile.cashBoost}%`,
            inline: true
          },
          {
            name: '🌙 Offline Gas Boost',
            value: `${profile.offlineGasBoost}%`,
            inline: true
          },
          {
            name: '⛽ Base Gas/s',
            value: `${formatNumber(profile.gasps)}/s`,
            inline: true
          },
          {
            name: '🚀 Boosted Gas/s',
            value: `${formatNumber(profile.boostedGasps)}/s`,
            inline: true
          },
          {
            name: '💲 Sell Price',
            value: `$${profile.price}`,
            inline: true
          }
        )
        .setFooter({
          text: 'Oil Empire Companion Bot'
        });

      return interaction.reply({
        embeds: [embed]
      });
    }

    // --------------------
    // PROFILE DELETE
    // --------------------

    if (subcommand === 'delete') {
      db.prepare(`
        DELETE FROM profiles
        WHERE userId = ?
      `).run(userId);

      return interaction.reply({
        content: '🗑️ Profile deleted.'
      });
    }
  }
};
