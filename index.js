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
const rankEventos = require('./rank-eventos');
const boasVindas = require('./boas-vindas');
const mines = require('./mines'); // 🔥 MINES
const economiaCmds = require('./economia-cmds'); // 🔥 ECONOMIA

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
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
rankEventos(client);
boasVindas(client);
mines(client); // 🔥 ATIVA MINES
economiaCmds(client); // 🔥 ATIVA ECONOMIA

// ===== READY =====
client.once('ready', () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

console.log("TOKEN:", process.env.TOKEN_BOT);

// ===== LOGIN =====
client.login(process.env.TOKEN_BOT);
