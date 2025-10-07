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

// Excluded role IDs
const EXCLUDED_ROLE_IDS = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010'
];

// Slash commands
const commands = [
  {
    name: 'pingall',
    description: 'Ping all members excluding certain roles with alliance message'
  }
];

// Register slash commands for the new server
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
    const guild = interaction.guild;
    const channel = interaction.channel;

    const members = await guild.members.fetch();

    const eligibleMembers = members.filter(member => 
      !member.roles.cache.some(role => EXCLUDED_ROLE_IDS.includes(role.id)) &&
      !member.user.bot
    );

    const mentionBatches = [];
    const membersArray = Array.from(eligibleMembers.values());
    for (let i = 0; i < membersArray.length; i += 30) {
      const batch = membersArray.slice(i, i + 30).map(m => `<@${m.id}>`).join(' ');
      mentionBatches.push(batch);
    }

    const messageText = '📢 Please choose your alliance by reacting to the message in ⁠ඣ_self-roles. If your alliance is not listed, create a ticket in ⁠ඣ_tickets so we can add it for you.';

    await interaction.reply({ content: '✅ Sending pings...', ephemeral: true });

    for (const batch of mentionBatches) {
      await channel.send(`${batch}\n\n${messageText}`);
    }

    await interaction.followUp({ content: '✅ Message sent successfully!', ephemeral: true });

  } catch (err) {
    console.error('❌ Error sending message:', err);
    await interaction.reply({ content: '❌ Failed to send message.', ephemeral: true });
  }
});

// Keep alive
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// Login
client.login(TOKEN);
