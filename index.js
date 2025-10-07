require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// --- Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// --- Configuration ---
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
const TARGET_ROLE_ID = '1424424815569141870';

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('pingall')
    .setDescription('Ping the role excluding members with certain roles'),

  new SlashCommandBuilder()
    .setName('cleanrole')
    .setDescription('Remove a specific role from members who have excluded roles')
].map(cmd => cmd.toJSON());

// --- Register commands ---
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
    console.error('Error registering commands:', err);
  }
})();

// --- Ready event ---
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const guild = interaction.guild;
  if (!guild) return;

  await guild.members.fetch(); // Ensure all members are cached

  // --- Pingall command ---
  if (interaction.commandName === 'pingall') {
    // Check if anyone with TARGET_ROLE_ID exists who is not excluded
    const membersWithRole = guild.members.cache.filter(member => 
      member.roles.cache.has(TARGET_ROLE_ID) &&
      !member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))
    );

    if (membersWithRole.size === 0) {
      await interaction.reply({ content: 'No members to ping with that role.', ephemeral: true });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      return;
    }

    // Ping the role itself
    const message = `<@&${TARGET_ROLE_ID}>\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;

    await interaction.reply({ content: message, allowedMentions: { roles: [TARGET_ROLE_ID] } });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }

  // --- Cleanrole command ---
  if (interaction.commandName === 'cleanrole') {
    let count = 0;
    guild.members.cache.forEach(member => {
      if (member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))) {
        if (member.roles.cache.has(TARGET_ROLE_ID)) {
          member.roles.remove(TARGET_ROLE_ID).catch(console.error);
          count++;
        }
      }
    });

    await interaction.reply({ content: `✅ Removed the role from ${count} members who had excluded roles.`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }
});

// --- Express server for uptime ---
app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// --- Login ---
client.login(process.env.TOKEN);
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// --- Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// --- Configuration ---
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
const TARGET_ROLE_ID = '1424424815569141870';

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('pingall')
    .setDescription('Ping members with a specific role excluding certain roles'),

  new SlashCommandBuilder()
    .setName('cleanrole')
    .setDescription('Remove a specific role from members who have excluded roles')
].map(cmd => cmd.toJSON());

// --- Register commands ---
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
    console.error('Error registering commands:', err);
  }
})();

// --- Ready event ---
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const guild = interaction.guild;
  if (!guild) return;

  await guild.members.fetch(); // Ensure all members are cached

  // --- Pingall command ---
  if (interaction.commandName === 'pingall') {
    const membersToPing = guild.members.cache
      .filter(member => member.roles.cache.has(TARGET_ROLE_ID)) // Has target role
      .filter(member => !member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))) // Exclude specific roles
      .map(member => `<@${member.id}>`);

    if (membersToPing.length === 0) {
      return interaction.reply('No members to ping with that role.');
    }

    const message = `**@everyone**\n${membersToPing.join(' ')}\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;

    await interaction.reply({ content: message, allowedMentions: { parse: ['users'] } });
  }

  // --- Cleanrole command ---
  if (interaction.commandName === 'cleanrole') {
    let count = 0;
    guild.members.cache.forEach(member => {
      if (member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))) {
        if (member.roles.cache.has(TARGET_ROLE_ID)) {
          member.roles.remove(TARGET_ROLE_ID).catch(console.error);
          count++;
        }
      }
    });

    await interaction.reply(`✅ Removed the role from ${count} members who had excluded roles.`);
  }
});

// --- Express server for uptime ---
app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// --- Login ---
client.login(process.env.TOKEN);
