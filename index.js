const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const db = require('replit.database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔁 Toggle for guild applications
let guildApplicationsOpen = true;

// 🚫 Initial empty slur list
let filteredWords = [];

// List of words or phrases that are considered inappropriate
const INAPPROPRIATE_WORDS = [
  'nigger', 'nigga', 'chinga', 'faggot', 'retard', 'bitch', 'slut', 'cunt', 'motherfucker'
];

// ❌ Channels/categories where 'guild' response is disabled
const BLOCKED_CHANNEL_IDS = ['1361208111880339527', '1363099465170423819'];
const BLOCKED_CATEGORY_IDS = ['1362327727922872460', '1361201521433378909'];

// 🛑 Channel exempted from moderation (e.g., mod/test channel)
const EXEMPT_CHANNEL_ID = '1362670205574054058';

// Admin commands cooldown
let cooldown = false;

// Load filtered words from the Replit database on bot startup
async function loadFilteredWords() {
  const storedWords = await db.get('filteredWords');
  if (storedWords) {
    filteredWords = storedWords;
  }
  console.log('Filtered words loaded:', filteredWords);
}

// 🔑 Admin commands to manage filtered words
const isAdmin = (message) => message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Load filtered words from the database on startup
  await loadFilteredWords();
});

// 🧼 Global moderation (skip only the exempt channel)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🧼 Check if the message contains any filtered word
  const hasBannedWord = filteredWords.some((word) => message.content.toLowerCase().includes(word.toLowerCase()));

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

    // Check if the word is inappropriate
    if (INAPPROPRIATE_WORDS.some(inappropriateWord => word.toLowerCase().includes(inappropriateWord))) {
      return message.reply('❌ This word or phrase is considered inappropriate and cannot be added to the filter.');
    }

    // Check if the word already exists in the filter
    if (filteredWords.includes(word)) {
      return message.reply('❌ This word is already in the filter.');
    }

    // Add the word to the filter
    filteredWords.push(word);
    await db.set('filteredWords', filteredWords);
    message.reply(`✅ "${word}" has been added to the filter.`);
  }

  if (message.content.startsWith('!removeword ') && isAdmin(message)) {
    const word = message.content.slice(12).trim();
    if (!word) return message.reply('❌ Please provide a word to remove from the filter.');

    const index = filteredWords.indexOf(word);
    if (index === -1) {
      return message.reply('❌ This word is not in the filter.');
    }

    filteredWords.splice(index, 1);
    await db.set('filteredWords', filteredWords);
    message.reply(`✅ "${word}" has been removed from the filter.`);
  }

  if (message.content === '!listwords' && isAdmin(message)) {
    if (filteredWords.length === 0) {
      return message.reply('⚠️ No words are currently in the filter.');
    }
    message.reply(`Filtered words: ${filteredWords.join(', ')}`);
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
