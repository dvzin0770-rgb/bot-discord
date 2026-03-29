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
    if (!message.content.startsWith('!roleta')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);
    const cor = args[2];

    const db = getDB();
    const id = message.author.id;

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (db.users[id] < aposta) {
      return message.reply(`Saldo: ${db.users[id]}`);
    }

    db.users[id] -= aposta;

    const cores = ['red','black','green'];
    const r = cores[Math.floor(Math.random()*3)];

    let ganho = 0;

    if (cor === r) {
      ganho = r === 'green' ? aposta * 14 : aposta * 2;
      db.users[id] += ganho;
    }

    saveDB(db);

    message.reply(`Resultado: ${r} | ${ganho > 0 ? 'GANHOU' : 'PERDEU'}`);
  });
};
