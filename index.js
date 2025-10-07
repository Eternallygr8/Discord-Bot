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

// --- Config ---
const GUILD_ID = process.env.GUILD_ID; // Your server ID
const TARGET_ROLE_ID = '1424424815569141870'; // Role to ping and remove
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
const PING_CHANNEL_ID = '1424334490855014410'; // Channel where pingall will send
const SIX_HOURS = 6 * 60 * 60 * 1000;

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Remove target role from members with excluded roles'),
  new SlashCommandBuilder()
    .setName('pingall')
    .setDescription('Ping everyone with the target role'),
  new SlashCommandBuilder()
    .setName('addexclude')
    .setDescription('Add new role to exclusion list')
    .addStringOption(option =>
      option.setName('roleid')
        .setDescription('Role ID to exclude')
        .setRequired(true)
    )
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

// --- Express server for uptime ---
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- Bot ready ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Schedule first auto-run after 6 hours
  setTimeout(() => {
    runScheduledTasks();
    setInterval(runScheduledTasks, SIX_HOURS);
  }, SIX_HOURS);
});

// --- Scheduled tasks ---
async function runScheduledTasks() {
  await cleanMembers();
  // Wait 1 minute then pingall
  setTimeout(pingAllMembers, 60 * 1000);
}

// --- Clean members ---
async function cleanMembers() {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();

    const membersToClean = guild.members.cache.filter(member =>
      member.roles.cache.has(TARGET_ROLE_ID) &&
      member.roles.cache.some(r => EXCLUDED_ROLES.includes(r.id))
    );

    for (const [id, member] of membersToClean) {
      await member.roles.remove(TARGET_ROLE_ID).catch(() => {});
    }

    console.log(`Cleaned ${membersToClean.size} members`);
  } catch (err) {
    console.error('Error in cleaning members:', err);
  }
}

// --- Ping all members ---
async function pingAllMembers(channelId = PING_CHANNEL_ID) {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();

    const membersToPing = guild.members.cache
      .filter(member => member.roles.cache.has(TARGET_ROLE_ID) && !member.user.bot)
      .map(member => `<@${member.id}>`);

    if (membersToPing.length === 0) return;

    const channel = await guild.channels.fetch(channelId);
    const message = `${membersToPing.join(' ')}\nPlease choose your alliance by reacting to the message in <#1424381105586438175>. If your alliance is not listed, create a ticket in <#1424354525535535144>.`;

    await channel.send({ content: message, allowedMentions: { parse: ['users', 'roles'] } });
    console.log('Pingall sent!');
  } catch (err) {
    console.error('Error in pingAllMembers:', err);
  }
}

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'clean') {
    await cleanMembers();
    await interaction.reply({ content: 'Clean command executed.', ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }

  if (commandName === 'pingall') {
    await pingAllMembers(interaction.channelId);
    await interaction.reply({ content: 'Pingall executed.', ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }

  if (commandName === 'addexclude') {
    const newRoleId = interaction.options.getString('roleid');
    if (!EXCLUDED_ROLES.includes(newRoleId)) EXCLUDED_ROLES.push(newRoleId);
    await interaction.reply({ content: `Role ${newRoleId} added to exclusion list.`, ephemeral: true });
  }
});

// --- Login ---
client.login(process.env.TOKEN);
