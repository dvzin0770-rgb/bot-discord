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
const mines = require('./mines');
const economiaCmds = require('./economia-cmds');
const addMoney = require('./addmoney');
const topRicos = require('./topricos');

// 🎮 MINIGAMES
const slot = require('./slot');
const coinflip = require('./coinflip');
const roleta = require('./roleta');
const duelo = require('./duelo');
const boss = require('./boss');
const blackjack = require('./blackjack');
const guess = require('./guess');

// 👑 FORMULÁRIO CAPITÃO (ADICIONADO)
const formCapitao = require('./formCapitao');

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
mines(client);
economiaCmds(client);
addMoney(client);
topRicos(client);

// 🎮 ATIVAR MINIGAMES
slot(client);
coinflip(client);
roleta(client);
duelo(client);
boss(client);
blackjack(client);
guess(client);

// 👑 ATIVAR FORMULÁRIO CAPITÃO (ADICIONADO)
formCapitao(client);

// ===== READY =====
client.once('ready', () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

console.log("TOKEN:", process.env.TOKEN_BOT);

// ===== LOGIN =====
client.login(process.env.TOKEN_BOT);
