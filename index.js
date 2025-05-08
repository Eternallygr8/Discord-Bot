const { Client, GatewayIntentBits, PermissionsBitField, REST, Routes } = require('discord.js');
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

let guildApplicationsOpen = true;

const MODERATOR_IDS = ['659065769275162624', '445222709950152704', '579301731200925697', '587937831930822657'];

const BANNED_PATTERNS = [
  /n[\W_]*i[\W_]*g[\W_]*g[\W_]*a/i,
  /n[\W_]*i[\W_]*g[\W_]*g[\W_]*e[\W_]*r/i,
  /ch[\W_]*i[\W_]*g[\W_]*g[\W_]*a/i,
  /r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /f[\W_]*a[\W_]*g[\W_]*g[\W_]*o[\W_]*t/i,
  /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,
  /s[\W_]*l[\W_]*u[\W_]*t/i,
  /c[\W_]*u[\W_]*n[\W_]*t/i,
  /m[\W_]*o[\W_]*t[\W_]*h[\W_]*e[\W_]*r[\W_]*f[\W_]*u[\W_]*c[\W_]*k[\W_]*e[\W_]*r/i,
  /b[\W_]*a[\W_]*s[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /d[\W_]*i[\W_]*k/i,
  /a[\W_]*s[\W_]*s/i,
  /f[\W_]*u[\W_]*c[\W_]*k/i,
  /p[\W_]*u[\W_]*s[\W_]*s/i,
  /c[\W_]*o[\W_]*c[\W_]*k/i,
  /t[\W_]*w[\W_]*a[\W_]*t/i,
  /w[\W_]*h[\W_]*o[\W_]*r[\W_]*e/i,
  /s[\W_]*h[\W_]*i[\W_]*t/i,
  /b[\W_]*u[\W_]*m[\W_]*i[\W_]*s/i,
  /f[\W_]*a[\W_]*g[\W_]*g/i
];

const BLOCKED_CHANNEL_IDS = ['1361208111880339527', '1363099465170423819'];
const BLOCKED_CATEGORY_IDS = ['1362327727922872460', '1361201521433378909'];
const EXEMPT_CHANNEL_ID = '1362670205574054058';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  {
    name: 'openapps',
    description: 'Open guild applications for new members',
  },
  {
    name: 'closeapps',
    description: 'Close guild applications',
  },
  {
    name: 'addword',
    description: 'Add a word to the banned word filter',
    options: [
      {
        name: 'word',
        description: 'The word to add to the filter',
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: 'removeword',
    description: 'Remove a word from the banned word filter',
    options: [
      {
        name: 'word',
        description: 'The word to remove from the filter',
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: 'listword',
    description: 'List all words in the banned word filter',
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

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

app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'openapps') {
    const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);
    if (!isAdmin) return interaction.reply('❌ You don’t have permission to do that.');
    guildApplicationsOpen = true;
    return interaction.reply('✅ Guild applications are now **OPEN**.');
  }

  if (commandName === 'closeapps') {
    const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);
    if (!isAdmin) return interaction.reply('❌ You don’t have permission to do that.');
    guildApplicationsOpen = false;
    return interaction.reply('🚫 Guild applications are now **CLOSED**.');
  }

  if (commandName === 'addword') {
    if (!MODERATOR_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ You don’t have permission to use this command.', ephemeral: true });
    }

    const word = interaction.options.getString('word');
    let pattern;
    if (word.endsWith('*')) {
      const base = word.slice(0, -1);
      pattern = new RegExp(base.split('').join('[\\W_]*') + '.*', 'i');
    } else {
      pattern = new RegExp(word.split('').join('[\\W_]*'), 'i');
    }
    BANNED_PATTERNS.push(pattern);

    const reply = await interaction.reply({ content: `✅ "${word}" has been added to the banned word filter.`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }

  if (commandName === 'removeword') {
    if (!MODERATOR_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ You don’t have permission to use this command.', ephemeral: true });
    }

    const word = interaction.options.getString('word');
    const patternToRemove = new RegExp(word.split('').join('[\\W_]*'), 'i');
    const before = BANNED_PATTERNS.length;
    const after = BANNED_PATTERNS.filter(p => p.toString() !== patternToRemove.toString());

    if (before === after.length) {
      const reply = await interaction.reply({ content: `⚠️ "${word}" was not found in the banned list.`, ephemeral: true });
      return setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    }

    BANNED_PATTERNS.length = 0;
    BANNED_PATTERNS.push(...after);

    const reply = await interaction.reply({ content: `✅ "${word}" has been removed from the banned word filter.`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  }

  if (commandName === 'listword') {
    if (!MODERATOR_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ You don’t have permission to use this command.', ephemeral: true });
    }

    if (BANNED_PATTERNS.length === 0) {
      return interaction.reply({ content: '⚠️ No words are currently banned.', ephemeral: true });
    }

    const cleanWords = BANNED_PATTERNS.map(p => {
      const raw = p.source;
      const cleaned = raw
        .replace(/\[\\W_\]\*/g, '')
        .replace(/\.\*/, '*')
        .replace(/^\/|\/i$/g, '');
      return `• \`${cleaned}\``;
    }).join('\n');

    return interaction.reply({ content: `🛑 **Banned Words:**\n${cleanWords}`, ephemeral: true });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const hasBannedWord = BANNED_PATTERNS.some(pattern => pattern.test(message.content));
  if (hasBannedWord && message.channel.id !== EXEMPT_CHANNEL_ID) {
    try {
      await message.delete();
      const warning = await message.channel.send(`⚠️ <@${message.author.id}>, your message was removed due to inappropriate content.`);
      setTimeout(() => warning.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error('Failed to delete message or send warning:', err);
    }
    return;
  }

  if (message.content.toLowerCase().includes('guild')) {
    if (
      BLOCKED_CHANNEL_IDS.includes(message.channel.id) ||
      BLOCKED_CATEGORY_IDS.includes(message.channel.parentId)
    ) return;

    const userID = message.author.id;
    const recruitmentChannelId = '1361634464102617201';
    const ticketChannelId = '1362328988126675056';

    const replyMessage = guildApplicationsOpen
      ? `Hey <@${userID}>, it looks like you're interested in joining the guild! To become a member, please make sure you meet the requirements listed in <#${recruitmentChannelId}>. Once you've confirmed that, you can create a ticket in <#${ticketChannelId}>, and our staff members will verify your eligibility. After verification, you'll be ready to join! Good luck, and we look forward to seeing you in the guild!`
      : `Hey <@${userID}>, thanks for your interest! Unfortunately, the guild application is currently **closed** as the guild is full. Please check back later for future opportunities!`;

    message.channel.send(replyMessage);
  }
});

client.login(TOKEN);
