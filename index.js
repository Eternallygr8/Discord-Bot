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

// --- Slash commands ---
const commands = [
  new SlashCommandBuilder().setName('pingall').setDescription('Ping the target role.'),
  new SlashCommandBuilder().setName('cleanroles').setDescription('Remove the target role from excluded members.'),
  new SlashCommandBuilder().setName('addexcluded').setDescription('Add a new role to exclusion list.').addStringOption(option =>
    option.setName('roleid').setDescription('Role ID to exclude').setRequired(true)
  ),
  new SlashCommandBuilder().setName('listexcludedroles').setDescription('List all excluded roles with names.')
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

// --- Ready ---
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Slash command handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const guild = interaction.guild;
  if (!guild) return;

  if (interaction.commandName === 'pingall') {
    const channel = guild.channels.cache.get(TARGET_CHANNEL_ID);
    if (!channel) return interaction.reply({ content: 'Target channel not found.', ephemeral: true });

    const message = `<@&${TARGET_ROLE_ID}> Please choose your alliance by reacting to the message in <#${SELF_ROLES_CHANNEL_ID}>. If your alliance is not listed, create a ticket in <#${TICKET_CHANNEL_ID}>.`;
    await channel.send(message);
    await interaction.reply({ content: 'Ping sent successfully.', ephemeral: true });

    // Auto delete the command reply after 10s
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'cleanroles') {
    await guild.members.fetch();
    const targetRole = guild.roles.cache.get(TARGET_ROLE_ID);
    if (!targetRole) return interaction.reply({ content: 'Target role not found.', ephemeral: true });

    let removed = 0;
    for (const member of guild.members.cache.values()) {
      if (member.roles.cache.has(TARGET_ROLE_ID) && member.roles.cache.some(r => EXCLUDED_ROLES.has(r.id))) {
        await member.roles.remove(TARGET_ROLE_ID).catch(() => {});
        removed++;
      }
    }

    await interaction.reply({ content: `Removed target role from ${removed} members.`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'addexcluded') {
    const roleId = interaction.options.getString('roleid');
    EXCLUDED_ROLES.add(roleId);
    await interaction.reply({ content: `✅ Added role ID \`${roleId}\` to exclusion list.`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
  }

  else if (interaction.commandName === 'listexcludedroles') {
    await guild.roles.fetch();
    const roleList = Array.from(EXCLUDED_ROLES).map(id => {
      const role = guild.roles.cache.get(id);
      return role ? `${role.name} — \`${id}\`` : `Unknown Role — \`${id}\``;
    }).join('\n');

    await interaction.reply({ content: `**Excluded Roles:**\n${roleList}`, ephemeral: true });
  }
});

// --- Express server for uptime ---
app.get('/', (req, res) => {
  res.send('Bot is online!');
});
app.listen(port, () => console.log(`🌐 Server running on port ${port}`));

// --- Login ---
client.login(process.env.TOKEN);
