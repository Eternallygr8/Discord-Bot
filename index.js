const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1409913915898462372'; // New server ID

// 👇 Excluded role IDs (users with any of these roles will not be pinged)
const EXCLUDED_ROLE_IDS = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010'
];

// 🧾 Slash commands
const commands = [
  {
    name: 'pingall',
    description: 'Ping all members excluding certain roles with alliance message'
  }
];

// 🧠 Register slash commands for the new server
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered application (/) commands in the new server.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// ✅ When bot is ready
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ⚙️ Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'pingall') return;

  // Only allow admins to use
  const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);
  if (!isAdmin) return interac
