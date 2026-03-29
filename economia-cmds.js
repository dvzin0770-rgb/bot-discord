const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const cmd = args[0].toLowerCase();

    const db = getDB();
    const id = message.author.id;

    if (!db[id]) db[id] = 10000;

    // 💰 SALDO
    if (cmd === '!saldo') {
      return message.reply(`💰 Seu saldo: ${db[id]} moedas`);
    }

    // 🎁 DAILY
    if (cmd === '!daily') {
      if (!db.daily) db.daily = {};

      const agora = Date.now();
      const ultimo = db.daily[id] || 0;

      if (agora - ultimo < 86400000) {
        return message.reply('⏳ Você já coletou hoje!');
      }

      db[id] += 5000;
      db.daily[id] = agora;
      saveDB(db);

      return message.reply('🎁 Você ganhou 5000 moedas!');
    }

    // 🏆 TOP RICOS
    if (cmd === '!topricos') {
      const ranking = Object.entries(db)
        .filter(([key]) => !isNaN(key))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      let texto = '';

      for (let i = 0; i < ranking.length; i++) {
        const user = await client.users.fetch(ranking[i][0]).catch(() => null);
        const nome = user ? user.username : 'Desconhecido';

        const medalha =
          i === 0 ? '🥇' :
          i === 1 ? '🥈' :
          i === 2 ? '🥉' : `#${i + 1}`;

        texto += `${medalha} **${nome}** — 💰 ${ranking[i][1]}\n`;
      }

      const pos = ranking.findIndex(u => u[0] === id);

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💰 RANKING DE RICOS — FROSTVOW')
            .setDescription(texto)
            .addFields({
              name: '📍 Sua posição',
              value: pos !== -1 ? `#${pos + 1} com ${db[id]} moedas` : 'Fora do top'
            })
        ]
      });
    }

  });
};
