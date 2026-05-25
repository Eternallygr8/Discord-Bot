const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Show bot latency'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Pinging...',
      fetchReply: true
    });

    const ping =
      sent.createdTimestamp - interaction.createdTimestamp;

    const apiPing = Math.round(
      interaction.client.ws.ping
    );

    const embed = new EmbedBuilder()
      .setColor('#00ff88')
      .setTitle('🏓 Pong!')
      .addFields(
        {
          name: '📡 Bot Latency',
          value: `${ping}ms`,
          inline: true
        },
        {
          name: '🌐 API Latency',
          value: `${apiPing}ms`,
          inline: true
        }
      )
      .setFooter({
        text: 'Oil Empire Companion Bot'
      });

    await interaction.editReply({
      content: '',
      embeds: [embed]
    });
  }
};
