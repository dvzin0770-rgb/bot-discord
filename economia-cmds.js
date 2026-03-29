const { EmbedBuilder } = require('discord.js');
const eco = require('./economia');

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const cmd = args[0].toLowerCase();
    const id = message.author.id;

    // 💰 SALDO
    if (cmd === '!saldo') {
      return message.reply(`💰 Seu saldo: ${eco.getSaldo(id)} moedas`);
    }

    // 🎁 DAILY
    if (cmd === '!daily') {
      const fs = require('fs');
      const DB_PATH = './economia.json';
      const db = JSON.parse(fs.readFileSync(DB_PATH));

      if (!db.daily) db.daily = {};

      const agora = Date.now();
      const ultimo = db.daily[id] || 0;

      if (agora - ultimo < 86400000) {
        return message.reply('⏳ Você já coletou hoje!');
      }

      eco.addSaldo(id, 5000);
      db.daily[id] = agora;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

      return message.reply('🎁 Você ganhou 5000 moedas!');
    }

    // 🏆 TOP
    if (cmd === '!topricos') {
      const fs = require('fs');
      const db = JSON.parse(fs.readFileSync('./economia.json'));

      const ranking = Object.entries(db.users || {})
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

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('💰 TOP RICOS')
            .setDescription(texto || 'Ninguém ainda.')
        ]
      });
    }

  });

};
