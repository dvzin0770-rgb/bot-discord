const fs = require('fs');
const {
  EmbedBuilder
} = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      daily: {}
    }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH));
  if (!data.users) data.users = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!roleta')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);
    const cor = args[2]?.toLowerCase();

    if (!aposta || !cor) {
      return message.reply('❌ Use: !roleta <valor> <red/black/green>');
    }

    const db = getDB();
    const id = message.author.id;

    if (db.users[id] === undefined) {
      db.users[id] = 10000;
      saveDB(db);
    }

    if (db.users[id] < aposta) {
      return message.reply(
        `💸 Seu saldo é **${db.users[id]} moedas**.\nComo vai apostar isso? 🤨`
      );
    }

    const cores = ['red', 'black', 'green'];
    const resultado = cores[Math.floor(Math.random() * cores.length)];

    db.users[id] -= aposta;

    let ganho = 0;

    if (cor === resultado) {
      if (cor === 'green') ganho = aposta * 14;
      else ganho = aposta * 2;

      db.users[id] += ganho;
    }

    saveDB(db);

    const emoji =
      resultado === 'red' ? '🔴' :
      resultado === 'black' ? '⚫' : '🟢';

    const embed = new EmbedBuilder()
      .setTitle('🎯 ROLETA — FROSTVOW')
      .setDescription(
        `🎡 Girando a roleta...\n\n` +
        `Resultado: ${emoji} **${resultado.toUpperCase()}**\n\n` +
        (ganho > 0
          ? `🎉 Você ganhou **${ganho} moedas!**`
          : `💀 Você perdeu **${aposta} moedas**`)
      )
      .setColor('#111827');

    message.channel.send({ embeds: [embed] });

  });

};
