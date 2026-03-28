const { Client, GatewayIntentBits, Partials } = require('discord.js');

// ===== IMPORTAR ARQUIVOS =====
const ticket = require('./ticket');
const recrutamento = require('./recrutamento');
const comandos = require('./comandos');
const stock = require('./stock');
const eventos = require('./bot.eventos');
const pings = require('./pings');
const quiz = require('./quiz');
const level = require('./level');

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// ===== DEBUG TOKEN 🔥 =====
console.log("TOKEN LIDO:", process.env.TOKEN);

// ===== ATIVAR SISTEMAS =====
ticket(client);
recrutamento(client);
comandos(client);
stock(client);
eventos(client);
pings(client);
quiz(client);
level(client);

// ===== READY =====
client.once('ready', () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

console.log("TOKEN:", process.env.TOKEN_BOT);

// ===== LOGIN =====
client.login(process.env.TOKEN_BOT);
