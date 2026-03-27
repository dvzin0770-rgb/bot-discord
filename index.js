const { Client, GatewayIntentBits } = require('discord.js');

// ===== IMPORTAR ARQUIVOS =====
const ticket = require('./ticket');
const recrutamento = require('./recrutamento');
const comandos = require('./comandos');
const stock = require('./stock');      // sistema de stock (Blox Fruits)
const eventos = require('./eventos');  // sistema de eventos/sorteios

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== ATIVAR SISTEMAS =====
ticket(client);       // tickets
recrutamento(client); // recrutamento
comandos(client);     // comandos gerais (!ping, !clear, !perfil, etc)
stock(client);        // stock do Blox Fruits
eventos(client);      // sorteios/eventos

// ===== READY =====
client.once('ready', () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
