require('dotenv').config();

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
// DRILL DATABASE
// --------------------

const drills = [
  {
    id: 'diamond',
    name: 'Diamond Drill',
    rarity: 'Divine',
    tier: 6,
    cost: 27500000000,
    gas: 2750
  },
  {
    id: 'ruby',
    name: 'Ruby Drill',
    rarity: 'Divine',
    tier: 7,
    cost: 85500000000,
    gas: 4500
  },
  {
    id: 'fusion',
    name: 'Fusion Drill',
    rarity: 'Divine',
    tier: 8,
    cost: 187500000000,
    gas: 7500
  },
  {
    id: 'uranium',
    name: 'Uranium Drill',
    rarity: 'Divine',
    tier: 9,
    cost: 437500000000,
    gas: 12500
  },
  {
    id: 'radium',
    name: 'Radium Drill',
    rarity: 'Prismatic',
    tier: 10,
    cost: 810000000000,
    gas: 18000
  },
  {
    id: 'palladium',
    name: 'Palladium Drill',
    rarity: 'Prismatic',
    tier: 11,
    cost: 1200000000000,
    gas: 25000
  },
  {
    id: 'thorium',
    name: 'Thorium Drill',
    rarity: 'Prismatic',
    tier: 12,
    cost: 2100000000000,
    gas: 37500
  }
];

// --------------------
// NUMBER FORMATTER
// --------------------

function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';

  return num.toString();
}

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
