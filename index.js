const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Uptime Express server
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1409913915898462372'; // Your server ID

// Excluded roles and bot ID
const EXCLUDED_ROLE_IDS = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010',
  '1424359563443834911', // bot ID
];

const commands = [
  {
    name: 'pingall',
    description: 'Ping everyone excluding certain roles'
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Register commands
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'pingall') {
    await interaction.deferReply({ ephemeral: true }); // Prevent "thinking..."

    const channel = interaction.channel;

    // Fetch all members in guild (needed for larger servers)
    await channel.guild.members.fetch();

    const membersToPing = channel.guild.members.cache
      .filter(m => !m.user.bot && !m.roles.cache.some(r => EXCLUDED_ROLE_IDS.includes(r.id)));

    const mentions = membersToPing.map(m => `<@${m.id}>`).join(' ');

    await channel.send(`${mentions}\nPlease choose your alliance by reacting to the message in <#1424381105586438175>. If your alliance is not listed, create a ticket in <#1424354525535535144>.`);

    await interaction.editReply({ content: '✅ Ping sent!', ephemeral: true });
  }
});

client.login(TOKEN);
