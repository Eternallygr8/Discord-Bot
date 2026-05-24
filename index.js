require('dotenv').config();

const drills = require('./data/drills.json');
const formatNumber = require('./utils/formatNumber');

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

// --------------------
// BOT SETUP
// --------------------

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// --------------------
// SLASH COMMANDS
// --------------------

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!'),

  new SlashCommandBuilder()
    .setName('drill')
    .setDescription('View drill information')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Drill name')
        .setRequired(true)
    )
].map(command => command.toJSON());

// --------------------
// REGISTER COMMANDS
// --------------------

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

// --------------------
// READY EVENT
// --------------------

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --------------------
// INTERACTION HANDLER
// --------------------

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // --------------------
  // /PING
  // --------------------

  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong!');
  }

  // --------------------
  // /DRILL
  // --------------------

  if (interaction.commandName === 'drill') {
    const drillName = interaction.options.getString('name').toLowerCase();

    const drill = drills.find(d => d.id === drillName);

    if (!drill) {
      return interaction.reply({
        content: '❌ Drill not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ffd000')
      .setTitle(`⛽ ${drill.name}`)
      .setDescription('Oil Empire Drill Information')
      .addFields(
        {
          name: '💰 Cost',
          value: `$${formatNumber(drill.cost)}`,
          inline: true
        },
        {
          name: '⛽ Gas/s',
          value: `${formatNumber(drill.gas)}/s`,
          inline: true
        },
        {
          name: '💎 Tier',
          value: `${drill.tier}`,
          inline: true
        },
        {
          name: '✨ Rarity',
          value: drill.rarity,
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
});

// --------------------
// LOGIN
// --------------------

client.login(process.env.TOKEN);
