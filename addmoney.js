const fs = require('fs');

const DB_PATH = './economia.json';
const DONO_ID = '1374388082908069899';

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

    if (!message.content.startsWith('!addmoney')) return;

    if (message.author.id !== DONO_ID) {
      return message.reply('❌ Você não pode usar esse comando.');
    }

    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const valor = parseInt(args[2]);

    if (!user || !valor) {
      return message.reply('❌ Use: !addmoney @user <valor>');
    }

    const db = getDB();

    if (db.users[user.id] === undefined) {
      db.users[user.id] = 0;
    }

    db.users[user.id] += valor;
    saveDB(db);

    message.reply(`💰 ${user.username} recebeu ${valor} moedas.`);
  });

};
