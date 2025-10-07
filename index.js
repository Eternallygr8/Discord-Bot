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
const GUILD_ID = '1409913915898462372'; // Your server ID

// Excluded role/user IDs
const EXCLUDED_ROLE_IDS = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010',
  '1424359563443834911' // bot's own ID
];

// Channel IDs
const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKETS_CHANNEL_ID = '1424354525535535144';

// Slash commands
const commands = [
  {
    name: 'pingall',
    description: 'Ping all members excluding certain roles with alliance message'
  }
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered application (/) commands in the server.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// Bot ready
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command handling
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'pingall') return;

  const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);
  if (!isAdmin) return interaction.reply({ content: '❌ You don’t have permission to do that.', ephemeral: true });

  try {
    // Acknowledge immediately
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const channel = interaction.channel;

    // Fetch all members
    const members = await guild.members.fetch();

    // Filter eligible members
    const eligibleMembers = members.filter(member =>
      !member.roles.cache.some(role => EXCLUDED_ROLE_IDS.includes(role.id)) &&
      !EXCLUDED_ROLE_IDS.includes(member.id) &&
      !member.user.bot
    );

    // Create mentions string
    const mentions = Array.from(eligibleMembers.values()).map(m => `<@${m.id}>`).join(' ');

    const messageText = `📢 Please choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKETS_CHANNEL_ID}> so we can add it for you.`;

    // Send all mentions together
    await channel.send(`${mentions}\n\n${messageText}`);

    await interaction.editReply({ content: '✅ Message sent successfully!' });

  } catch (err) {
    console.error('❌ Error sending message:', err);
    await interaction.editReply({ content: '❌ Failed to send message.' });
  }
});

// Keep alive
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// Login
client.login(TOKEN);
