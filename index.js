require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// --- Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- Config ---
const EXCLUDED_ROLES = [
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010',
  '1424359563443834911' // bot itself
];
const TARGET_ROLE_ID = '1424424815569141870';
const PING_CHANNEL_ID = '1424334490855014410';
const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKET_CHANNEL_ID = '1424354525535535144';

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder().setName('clean').setDescription('Remove target role from excluded members'),
  new SlashCommandBuilder().setName('pingall').setDescription('Ping target role in channel')
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

// --- Functions ---
async function runClean() {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.members.fetch();

  guild.members.cache.forEach(member => {
    if (member.roles.cache.has(TARGET_ROLE_ID)) {
      const hasExcluded = member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id));
      if (hasExcluded) {
        member.roles.remove(TARGET_ROLE_ID).catch(console.error);
      }
    }
  });
  console.log('Clean completed.');
}

async function sendPing() {
  const channel = await client.channels.fetch(PING_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  channel.send({
    content: `<@&${TARGET_ROLE_ID}>\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`,
    allowedMentions: { roles: [TARGET_ROLE_ID] }
  });
  console.log('Ping sent.');
}

// --- Ready ---
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Run clean + ping immediately on startup
  await runClean();
  setTimeout(async () => {
    await sendPing();
  }, 60 * 1000); // 1 minute delay

  // Repeat every 6 hours
  setInterval(async () => {
    await runClean();
    setTimeout(async () => {
      await sendPing();
    }, 60 * 1000);
  }, 6 * 60 * 60 * 1000);
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'clean') {
    await runClean();
    interaction.reply({ content: '✅ Clean executed.', ephemeral: true });
  }

  if (interaction.commandName === 'pingall') {
    await sendPing();
    interaction.reply({ content: '✅ Ping sent.', ephemeral: true });
  }
});

// --- Express server ---
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- Login ---
client.login(process.env.TOKEN);
