const fs = require('fs');

const DB_PATH = './economia.json';

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const db = getDB();
    const id = message.author.id;

    if (!db[id]) db[id] = { dinheiro: 10000, lastDaily: 0 };

    // 💰 SALDO
    if (message.content === '!saldo') {
      return message.reply(`💰 Seu saldo: **${db[id].dinheiro} moedas**`);
    }

    // 🎁 DAILY
    if (message.content === '!daily') {
      const agora = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;

      if (agora - db[id].lastDaily < cooldown) {
        const tempo = Math.ceil((cooldown - (agora - db[id].lastDaily)) / 1000 / 60);
        return message.reply(`⏳ Você já resgatou. Volte em ${tempo} minutos.`);
      }

      const recompensa = 5000;

      db[id].dinheiro += recompensa;
      db[id].lastDaily = agora;

      saveDB(db);

      return message.reply(`🎁 Você recebeu **${recompensa} moedas!**`);
    }

  });

};
