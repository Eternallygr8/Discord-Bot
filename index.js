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

// --- Role & channel IDs ---
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
const TARGET_ROLE_ID = '1424424815569141870';
const PING_CHANNEL_ID = '1424334490855014410';
const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKET_CHANNEL_ID = '1424354525535535144';

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder().setName('pingall').setDescription('Ping everyone with the target role'),
  new SlashCommandBuilder().setName('clean').setDescription('Remove target role from members with excluded roles'),
  new SlashCommandBuilder().setName('cleanping').setDescription('Clean first then ping after 1 min')
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

// --- Express server ---
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- Helper functions ---
async function cleanRoles(guild) {
  await guild.members.fetch();
  guild.members.cache.forEach(member => {
    if (!member.user.bot && member.roles.cache.has(TARGET_ROLE_ID)) {
      if (member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))) {
        member.roles.remove(TARGET_ROLE_ID).catch(console.error);
        console.log(`Removed target role from ${member.user.tag}`);
      }
    }
  });
}

async function pingAll(guild) {
  const channel = guild.channels.cache.get(PING_CHANNEL_ID);
  if (!channel) return console.log('Ping channel not found');

  const message = `<@&${TARGET_ROLE_ID}>\nPlease choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;
  channel.send({ content: message, allowedMentions: { parse: ['roles'] } });
}

// --- Scheduled tasks ---
const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours

async function runScheduledTasks() {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await cleanRoles(guild);

  setTimeout(async () => {
    await pingAll(guild);
  }, 60 * 1000); // 1 min delay
}

function scheduleTasks() {
  runScheduledTasks(); // Run immediately on startup
  setInterval(runScheduledTasks, SIX_HOURS);
}

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const guild = interaction.guild;
  if (!guild) return;

  if (interaction.commandName === 'pingall') {
    await pingAll(guild);
    await interaction.reply({ content: 'Pingall executed.', ephemeral: true });
  }

  if (interaction.commandName === 'clean') {
    await cleanRoles(guild);
    await interaction.reply({ content: 'Clean executed.', ephemeral: true });
  }

  if (interaction.commandName === 'cleanping') {
    await cleanRoles(guild);
    await interaction.reply({ content: 'Clean executed. Pingall will run in 1 minute.', ephemeral: true });
    setTimeout(async () => {
      await pingAll(guild);
    }, 60 * 1000);
  }
});

// --- Ready ---
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  scheduleTasks();
});

// --- Login ---
client.login(process.env.TOKEN);