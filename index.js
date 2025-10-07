require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// --- Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,       // Required for commands
    GatewayIntentBits.GuildMembers  // Required to fetch member roles
  ]
});

// --- Excluded role IDs ---
const EXCLUDED_ROLES = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010',
  '1424359563443834911' // Bot itself
];

const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKET_CHANNEL_ID = '1424354525535535144';

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('pingall')
    .setDescription('Ping everyone excluding certain roles')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Commands registered!');
  } catch (err) {
    console.error(err);
  }
})();

// --- Ready ---
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'pingall') {
    const guild = interaction.guild;
    if (!guild) return;

    await guild.members.fetch(); // Ensure we have all members

    const membersToPing = guild.members.cache
      .filter(member => !member.user.bot)               // Exclude bots
      .filter(member => !member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id)))
      .map(member => `<@${member.id}>`);

    if (membersToPing.length === 0) {
      return interaction.reply('No members to ping.');
    }

    const message = `@everyone ${membersToPing.join(' ')}\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;

    await interaction.reply({ content: message, allowedMentions: { parse: ['users', 'everyone', 'roles'] } });
  }
});

// --- Express server for uptime monitoring ---
app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// --- Login ---
client.login(process.env.TOKEN);
