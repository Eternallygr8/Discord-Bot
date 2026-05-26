const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const db = require('../database');

const drills = require('../data/drills.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Manage your drill inventory')

    // ADD
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add drills')

        .addStringOption(option =>
          option
            .setName('drill')
            .setDescription('Drill name')
            .setRequired(true)
            .setAutocomplete(true)
        )

        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Amount')
            .setRequired(true)
        )
    )

    // REMOVE
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove drills')

        .addStringOption(option =>
          option
            .setName('drill')
            .setDescription('Drill name')
            .setRequired(true)
            .setAutocomplete(true)
        )

        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Amount')
            .setRequired(true)
        )
    )

    // VIEW
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View inventory')
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    const subcommand =
      interaction.options.getSubcommand();

    //
    // ADD
    //

    if (subcommand === 'add') {
      const drillId =
        interaction.options.getString('drill');

      const amount =
        interaction.options.getInteger('amount');

      const existing = db.prepare(`
        SELECT * FROM inventory
        WHERE userId = ?
        AND drillId = ?
      `).get(userId, drillId);

      if (existing) {
        db.prepare(`
          UPDATE inventory
          SET amount = amount + ?
          WHERE userId = ?
          AND drillId = ?
        `).run(amount, userId, drillId);
      } else {
        db.prepare(`
          INSERT INTO inventory
          (userId, drillId, amount)
          VALUES (?, ?, ?)
        `).run(userId, drillId, amount);
      }

      return interaction.reply({
        content:
          `✅ Added ${amount}x ${drillId}.`
      });
    }

    //
    // REMOVE
    //

    if (subcommand === 'remove') {
      const drillId =
        interaction.options.getString('drill');

      const amount =
        interaction.options.getInteger('amount');

      const existing = db.prepare(`
        SELECT * FROM inventory
        WHERE userId = ?
        AND drillId = ?
      `).get(userId, drillId);

      if (!existing) {
        return interaction.reply({
          content:
            '❌ Drill not found in inventory.',
          ephemeral: true
        });
      }

      const newAmount =
        existing.amount - amount;

      if (newAmount <= 0) {
        db.prepare(`
          DELETE FROM inventory
          WHERE userId = ?
          AND drillId = ?
        `).run(userId, drillId);
      } else {
        db.prepare(`
          UPDATE inventory
          SET amount = ?
          WHERE userId = ?
          AND drillId = ?
        `).run(newAmount, userId, drillId);
      }

      return interaction.reply({
        content:
          `🗑️ Removed ${amount}x ${drillId}.`
      });
    }

    //
    // VIEW
    //

    if (subcommand === 'view') {
      const inventory = db.prepare(`
        SELECT * FROM inventory
        WHERE userId = ?
      `).all(userId);

      if (inventory.length === 0) {
        return interaction.reply({
          content:
            '❌ Inventory is empty.',
          ephemeral: true
        });
      }

      const description = inventory
        .map(item => {
          const drill = drills.find(
            d => d.id === item.drillId
          );

          return `⛽ ${drill.name} ×${item.amount}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📦 Drill Inventory')
        .setDescription(description)

        .setFooter({
          text: 'Oil Empire Inventory'
        });

      return interaction.reply({
        embeds: [embed]
      });
    }
  }
};
