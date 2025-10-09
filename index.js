require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// --- Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// --- Config ---
const EXCLUDED_ROLES = new Set([
  '1424391054064615626',
  '1424252851227463822',
  '1424253228744441909',
  '1424253535826083870',
  '1424253759252463696',
  '1424278358098972692',
  '1424443778004943010',
  '1424359563443834911'
]);

const TARGET_ROLE_ID = '1424424815569141870';
const TARGET_CHANNEL_ID = '1424334490855014410';
const SELF_ROLES_CHANNEL_ID = '1424381105586438175';
const TICKET_CHANNEL_ID = '1424354525535535144';

let autoTasksEnabled = false;
let autoInterval = null;
let autoRunning = false; // safety flag

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder().setName('pingall').setDescription('Ping the target role.'),
  new SlashCommandBuilder().setName('cleanroles').setDescription('Remove the target role from excluded members.'),
  new SlashCommandBuilder().setName('addexcluded').setDescription('Add a new role to exclusion list.').addStringOption(option =>
    option.setName('roleid').setDescription('Role ID to exclude').setRequired(true)
  ),
  new SlashCommandBuilder().setName('listexcludedroles').setDescription('List all excluded roles with names.'),
  new SlashCommandBuilder().setName('toggleauto').setDescription('Toggle automatic 6-hour clean + ping task.')
].map(cmd => cmd.toJSON());

// --- Register slash commands ---
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

// --- Ready event ---
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Auto tasks ---
async function runAutoTasks() {
  if (autoRunning) return console.log('⚠️ Auto task skipped: previous run still in progress.');
  autoRunning = true;

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return console.log('❌ Guild not found.');

  console.log('⚙️ Running scheduled auto-clean and ping tasks...');
  await guild.members.fetch();

  const targetRole = guild.roles.cache.get(TARGET_ROLE_ID);
  if (!targetRole) return console.log('❌ Target role not found.');

  // --- Clean step ---
  let removed = 0;
  for (const member of guild.members.cache.values()) {
    if (member.roles.cache.has(TARGET_ROLE_ID) && member.roles.cache.some(r => EXCLUDED_ROLES.has(r.id))) {
      await member.roles.remove(TARGET_ROLE_ID).catch(() => {});
      removed++;
    }
  }
  console.log(`🧹 Auto clean complete. Removed role from ${removed} members.`);

  // --- Wait 1 minute before ping ---
  setTimeout(async () => {
    const channel = guild.channels.cache.get(TARGET_CHANNEL_ID);
    if (!channel) return console.log('❌ Target channel not found.');

    const message = `<@&${TARGET_ROLE_ID}> Please choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;
    await channel.send(message);
    console.log('📢 Auto ping sent.');

    autoRunning = false; // reset safety flag after completion
  }, 60 * 1000);
}

// --- Schedule auto tasks ---
function scheduleAutoTasks(runImmediately = false) {
  if (autoInterval) clearInterval(autoInterval);

  const sixHours = 6 * 60 * 60 * 1000;
  console.log('⏱️ Auto task scheduling started (6-hour interval).');

  if (runImmediately) runAutoTasks(); // first run immediately if desired
  autoInterval = setInterval(runAutoTasks, sixHours);
}

// --- Slash command handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const guild = interaction.guild;
  if (!guild) return;

  if (interaction.commandName === 'pingall') {
    const channel = guild.channels.cache.get(TARGET_CHANNEL_ID);
    if (!channel) return interaction.reply({ content: 'Target channel not found.', flags: 64 });

    const message = `<@&${TARGET_ROLE_ID}> Please choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;
    await channel.send(message);
    await interaction.reply({ content: 'Ping sent successfully.', flags: 64 });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'cleanroles') {
    await guild.members.fetch();
    const targetRole = guild.roles.cache.get(TARGET_ROLE_ID);
    if (!targetRole) return interaction.reply({ content: 'Target role not found.', flags: 64 });

    let removed = 0;
    for (const member of guild.members.cache.values()) {
      if (member.roles.cache.has(TARGET_ROLE_ID) && member.roles.cache.some(r => EXCLUDED_ROLES.has(r.id))) {
        await member.roles.remove(TARGET_ROLE_ID).catch(() => {});
        removed++;
      }
    }

    await interaction.reply({ content: `Removed target role from ${removed} members.`, flags: 64 });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'addexcluded') {
    const roleId = interaction.options.getString('roleid');
    EXCLUDED_ROLES.add(roleId);
    await interaction.reply({ content: `✅ Added role ID \`${roleId}\` to exclusion list.`, flags: 64 });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'listexcludedroles') {
    await guild.roles.fetch();
    const roleList = Array.from(EXCLUDED_ROLES).map(id => {
      const role = guild.roles.cache.get(id);
      return role ? `${role.name} — \`${id}\`` : `Unknown Role — \`${id}\``;
    }).join('\n');

    await interaction.reply({ content: `**Excluded Roles:**\n${roleList}`, flags: 64 });
  }

  else if (interaction.commandName === 'toggleauto') {
    autoTasksEnabled = !autoTasksEnabled;
    if (autoTasksEnabled) {
      scheduleAutoTasks(); // first run after 6 hours
      await interaction.reply({ content: '✅ Auto tasks **enabled**. Will start in 6 hours.', flags: 64 });
    } else {
      if (autoInterval) clearInterval(autoInterval);
      autoInterval = null;
      await interaction.reply({ content: '⏸️ Auto tasks **disabled**.', flags: 64 });
    }
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }
});

// --- Express server for uptime ---
app.get('/', (req, res) => {
  res.send('Bot is online!');
});
app.listen(port, () => console.log(`🌐 Server running on port ${port}`));

// --- Login ---
client.login(process.env.TOKEN);
