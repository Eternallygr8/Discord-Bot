require('dotenv').config();

const fs = require('fs');

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

// --------------------
// BOT SETUP
// --------------------

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// --------------------
// LOAD COMMAND FILES
// --------------------

const commandFiles = fs
  .readdirSync('./commands')
  .filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.data.name, command);

  commands.push(command.data.toJSON());
}

// --------------------
// REGISTER COMMANDS
// --------------------

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

// --------------------
// READY EVENT
// --------------------

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --------------------
// INTERACTION HANDLER
// --------------------

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    await interaction.reply({
      content: '❌ Error executing command.',
      ephemeral: true
    });
  }
});

// --------------------
// LOGIN
// --------------------

client.login(process.env.TOKEN);
