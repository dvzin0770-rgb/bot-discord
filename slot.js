const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, daily: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const simbolos = ['🍒','🍋','🍇','💎','🔥','👑'];

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!slot')) return;

    const aposta = parseInt(message.content.split(' ')[1]);
    const id = message.author.id;

    const db = getDB();
    if (db.users[id] === undefined) db.users[id] = 10000;

    if (db.users[id] < aposta) {
      return message.reply(`Saldo: ${db.users[id]}`);
    }

    db.users[id] -= aposta;

    const r = [
      simbolos[Math.floor(Math.random()*6)],
      simbolos[Math.floor(Math.random()*6)],
      simbolos[Math.floor(Math.random()*6)]
    ];

    let ganho = 0;

    if (r[0] === r[1] && r[1] === r[2]) ganho = aposta * 5;
    else if (r[0] === r[1] || r[1] === r[2]) ganho = aposta * 2;

    db.users[id] += ganho;
    saveDB(db);

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎰 SLOT')
          .setDescription(`${r.join(' ')}\n💰 ${ganho}`)
      ]
    });
  });
};
