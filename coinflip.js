const fs = require('fs');

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

    if (!message.content.startsWith('!coinflip')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);
    const escolha = args[2];

    if (!aposta || !escolha) {
      return message.reply('❌ Use: !coinflip <valor> <cara/coroa>');
    }

    const db = getDB();
    const id = message.author.id;

    if (db.users[id] === undefined) {
      db.users[id] = 10000;
      saveDB(db);
    }

    if (db.users[id] < aposta) {
      return message.reply('❌ Você não tem saldo suficiente.');
    }

    const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';

    if (escolha !== 'cara' && escolha !== 'coroa') {
      return message.reply('❌ Escolha cara ou coroa.');
    }

    if (resultado === escolha) {
      db.users[id] += aposta;
      saveDB(db);
      return message.reply(`🪙 Deu **${resultado}**! Você ganhou ${aposta} moedas!`);
    } else {
      db.users[id] -= aposta;
      saveDB(db);
      return message.reply(`🪙 Deu **${resultado}**! Você perdeu ${aposta} moedas.`);
    }
  });

};
