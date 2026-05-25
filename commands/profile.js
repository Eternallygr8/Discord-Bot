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
    .setDescription('Manage your profile')

    // SET SUBCOMMAND
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

        .addStringOption(option =>
          option
            .setName('oilps')
            .setDescription('Oil per second')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option
            .setName('boost')
            .setDescription('Cash boost %')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option
            .setName('price')
            .setDescription('Sell price')
            .setRequired(true)
        )
    )

    // VIEW SUBCOMMAND
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your profile')
    )

    // DELETE SUBCOMMAND
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete your profile')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const userId = interaction.user.id;

    // --------------------
    // PROFILE SET
    // --------------------

    if (subcommand === 'set') {
      const money = parseNumber(
        interaction.options.getString('money')
      );

      const oilps = parseNumber(
        interaction.options.getString('oilps')
      );

      const boost = interaction.options.getNumber('boost');
      const price = interaction.options.getNumber('price');

      if (isNaN(money) || isNaN(oilps)) {
        return interaction.reply({
          content: '❌ Invalid number format.',
          ephemeral: true
        });
      }

      db.prepare(`
        INSERT OR REPLACE INTO profiles
        (userId, money, oilps, boost, price)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        money,
        oilps,
        boost,
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
        .setTitle('📊 Your Profile')
        .addFields(
          {
            name: '💰 Money',
            value: `$${formatNumber(profile.money)}`,
            inline: true
          },
          {
            name: '⛽ Oil/s',
            value: `${formatNumber(profile.oilps)}/s`,
            inline: true
          },
          {
            name: '📈 Boost',
            value: `${profile.boost}%`,
            inline: true
          },
          {
            name: '💲 Sell Price',
            value: `$${profile.price}`,
            inline: true
          }
        );

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
