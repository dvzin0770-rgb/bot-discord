const fs = require('fs');

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

module.exports = (client) => {
  client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!coinflip')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);
    const escolha = args[2];

    const db = getDB();
    const id = message.author.id;

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (db.users[id] < aposta) {
      return message.reply(`Saldo: ${db.users[id]}`);
    }

    const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';

    let ganhou = escolha === resultado;

    if (ganhou) db.users[id] += aposta;
    else db.users[id] -= aposta;

    saveDB(db);

    message.reply(`Deu ${resultado} | ${ganhou ? 'GANHOU' : 'PERDEU'}`);
  });
};
