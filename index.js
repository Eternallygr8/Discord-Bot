const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔁 Toggle for guild applications
let guildApplicationsOpen = true;

// 🚫 Banned words list (case-insensitive)
const BANNED_WORDS = [
  'nigga',
  'nigger',
  'chigga',
  'retard',
  'faggot',
  'slur1',
  'slur2'
];

// 🛑 Channels and categories where GUILD message should not trigger
const BLOCKED_CHANNEL_IDS = ['1361208111880339527', '1363099465170423819'];
const BLOCKED_CATEGORY_IDS = ['1362327727922872460', '1361201521433378909'];

const TOKEN = process.env.TOKEN;

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  // 🧼 Global moderation — always runs
  const contentLower = message.content.toLowerCase();
  const foundBadWord = BANNED_WORDS.find(word => contentLower.includes(word));
  if (foundBadWord) {
    message.delete().catch(console.error);
    message.channel.send(`⚠️ <@${message.author.id}>, your message was removed due to inappropriate content.`)
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    return;
  }

  // 🛠 Admin-only controls
  const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

  if (message.content === '!openapps') {
    if (!isAdmin) return message.reply('❌ You don’t have permission to do that.');
    guildApplicationsOpen = true;
    return message.channel.send('✅ Guild applications are now **OPEN**.');
  }

  if (message.content === '!closeapps') {
    if (!isAdmin) return message.reply('❌ You don’t have permission to do that.');
    guildApplicationsOpen = false;
    return message.channel.send('🚫 Guild applications are now **CLOSED**.');
  }

  // 💬 Guild keyword response (in allowed channels only)
  if (contentLower.includes('guild')) {
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
