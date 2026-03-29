const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, daily: {} }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH));
  if (!data.users) data.users = {};
  if (!data.daily) data.daily = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const cmd = message.content.split(' ')[0];
    const id = message.author.id;

    const db = getDB();

    if (db.users[id] === undefined) {
      db.users[id] = 10000;
      saveDB(db);
    }

    if (cmd === '!saldo') {
      return message.reply(`💰 Saldo: ${db.users[id]}`);
    }

    if (cmd === '!daily') {
      const agora = Date.now();
      const ultimo = db.daily[id] || 0;

      if (agora - ultimo < 86400000) {
        return message.reply('⏳ Já coletou hoje');
      }

      db.users[id] += 5000;
      db.daily[id] = agora;
      saveDB(db);

      return message.reply('🎁 +5000 moedas');
    }

    if (cmd === '!topricos') {
      const ranking = Object.entries(db.users)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      let txt = '';

      for (let i = 0; i < ranking.length; i++) {
        const user = await client.users.fetch(ranking[i][0]).catch(() => null);
        txt += `#${i + 1} ${user?.username || 'User'} — ${ranking[i][1]}\n`;
      }

      message.channel.send({
        embeds: [new EmbedBuilder().setTitle('💰 TOP RICOS').setDescription(txt)]
      });
    }
  });
};
