const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Attachment,  // Added for attachment handling
  ]
});

// 🔁 Toggle for guild applications
let guildApplicationsOpen = true;

// 🚫 Initial slur list with bypass variants
const BANNED_PATTERNS = [
  /n[\W_]*i[\W_]*g[\W_]*g[\W_]*a/i,
  /n[\W_]*i[\W_]*g[\W_]*g[\W_]*e[\W_]*r/i,
  /ch[\W_]*i[\W_]*g[\W_]*g[\W_]*a/i, // Chigga
  /r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /f[\W_]*a[\W_]*g[\W_]*g[\W_]*o[\W_]*t/i,
  /s[\W_]*l[\W_]*u[\W_]*r[\W_]*1/i,
  /s[\W_]*l[\W_]*u[\W_]*r[\W_]*2/i,
  /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,
  /s[\W_]*l[\W_]*u[\W_]*t/i,
  /c[\W_]*u[\W_]*n[\W_]*t/i,
  /m[\W_]*o[\W_]*t[\W_]*h[\W_]*e[\W_]*r[\W_]*f[\W_]*u[\W_]*c[\W_]*k[\W_]*e[\W_]*r/i
];

// ❌ Channels/categories where 'guild' response is disabled
const BLOCKED_CHANNEL_IDS = ['1361208111880339527', '1363099465170423819'];
const BLOCKED_CATEGORY_IDS = ['1362327727922872460', '1361201521433378909'];

// 🛑 Channel exempted from moderation (e.g., mod/test channel)
const EXEMPT_CHANNEL_ID = '1362670205574054058';

// Admin commands cooldown
let cooldown = false;

// Load filtered words (slur list) from a database or static list
let filteredWords = BANNED_PATTERNS;

// Admin commands to manage filtered words
const isAdmin = (message) => message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🧼 Global moderation (skip only the exempt channel)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🧼 Check if the message contains any filtered word or pattern
  const hasBannedWord = filteredWords.some((pattern) => pattern.test(message.content.toLowerCase()));

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

  // ⚙️ Admin-only toggle commands
  if (message.content.startsWith('!addword ') && isAdmin(message)) {
    const word = message.content.slice(9).trim();
    if (!word) return message.reply('❌ Please provide a word to add to the filter.');

    // Add the word to the filter (if it's not already there)
    filteredWords.push(new RegExp(word, 'i'));
    message.reply(`✅ "${word}" has been added to the filter.`);
  }

  if (message.content.startsWith('!removeword ') && isAdmin(message)) {
    const word = message.content.slice(12).trim();
    if (!word) return message.reply('❌ Please provide a word to remove from the filter.');

    // Remove the word from the filter
    filteredWords = filteredWords.filter((pattern) => !pattern.test(word));
    message.reply(`✅ "${word}" has been removed from the filter.`);
  }

  if (message.content === '!listwords' && isAdmin(message)) {
    if (filteredWords.length === 0) {
      return message.reply('⚠️ No words are currently in the filter.');
    }
    message.reply(`Filtered words: ${filteredWords.map((pattern) => pattern.source).join(', ')}`);
  }

  // 💬 Respond to "guild" mentions (only in allowed channels)
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

client.login(process.env.TOKEN);
