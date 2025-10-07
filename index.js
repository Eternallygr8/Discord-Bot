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

// --- Role IDs ---
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

const TARGET_ROLE_ID = '1424424815569141870'; // role to ping/remove
const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKET_CHANNEL_ID = '1424354525535535144';
const GUILD_ID = process.env.GUILD_ID;

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('pingall')
    .setDescription('Ping everyone with the target role'),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove target role from members with excluded roles')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
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

  const guild = interaction.guild;
  if (!guild) return;

  await guild.members.fetch(); // fetch all members

  // --- Ping all members with target role ---
  if (interaction.commandName === 'pingall') {
    const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(TARGET_ROLE_ID));
    if (membersWithRole.size === 0) return interaction.reply('No members have the target role.');

    const message = `<@&${TARGET_ROLE_ID}>\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;

    await interaction.reply({ content: message, allowedMentions: { parse: ['roles'] } });
  }

  // --- Remove target role from members with excluded roles ---
  if (interaction.commandName === 'removerole') {
    let removedCount = 0;

    guild.members.cache.forEach(async member => {
      const hasTargetRole = member.roles.cache.has(TARGET_ROLE_ID);
      const hasExcludedRole = member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id));

      if (hasTargetRole && hasExcludedRole) {
        await member.roles.remove(TARGET_ROLE_ID).catch(console.error);
        removedCount++;
      }
    });

    await interaction.reply(`✅ Removed target role from ${removedCount} member(s) with excluded roles.`);
  }
});

// --- Automatic 6-hour check ---
const SIX_HOURS = 6 * 60 * 60 * 1000;

setInterval(async () => {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  await guild.members.fetch();

  guild.members.cache.forEach(async member => {
    const hasTargetRole = member.roles.cache.has(TARGET_ROLE_ID);
    const hasExcludedRole = member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id));

    if (hasTargetRole && hasExcludedRole) {
      await member.roles.remove(TARGET_ROLE_ID).catch(console.error);
      console.log(`Removed target role from ${member.user.tag} due to excluded roles.`);
    }
  });
}, SIX_HOURS);

// --- Express server for uptime monitoring ---
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- Login ---
client.login(process.env.TOKEN);
