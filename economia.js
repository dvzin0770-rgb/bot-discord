const fs = require('fs');
const path = require('path');

// =============================
// 📁 CONFIG
// =============================
const DB_PATH = path.join(__dirname, 'economia.json');

// =============================
// 🧠 CACHE
// =============================
let db = null;

// =============================
// 🔄 LOAD
// =============================
function loadDB() {

  if (db) return db;

  if (!fs.existsSync(DB_PATH)) {
    db = { users: {}, daily: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }

  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(data);

    if (!db.users) db.users = {};
    if (!db.daily) db.daily = {};

  } catch (err) {
    console.log('ERRO DB:', err);
    db = { users: {}, daily: {} };
  }

  return db;
}

// =============================
// 💾 SAVE
// =============================
function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// =============================
// 👤 USER
// =============================
function ensureUser(id) {
  const database = loadDB();

  if (!database.users[id]) {
    database.users[id] = {
      saldo: 10000,
      totalGanho: 0,
      totalPerdido: 0
    };
    saveDB();
  }
}

// =============================
// 💰 GET
// =============================
function getSaldo(id) {
  ensureUser(id);
  return db.users[id].saldo;
}

// =============================
// ➕ ADD
// =============================
function addMoney(id, valor) {
  ensureUser(id);
  db.users[id].saldo += valor;
  db.users[id].totalGanho += valor;
  saveDB();
}

// =============================
// ➖ REMOVE
// =============================
function removeMoney(id, valor) {
  ensureUser(id);
  db.users[id].saldo -= valor;
  db.users[id].totalPerdido += valor;

  if (db.users[id].saldo < 0) {
    db.users[id].saldo = 0;
  }

  saveDB();
}

// =============================
// 🎯 SET
// =============================
function setMoney(id, valor) {
  ensureUser(id);
  db.users[id].saldo = valor;
  saveDB();
}

// =============================
// 🎁 DAILY
// =============================
function daily(id) {

  const database = loadDB();
  ensureUser(id);

  const now = Date.now();
  const last = database.daily[id] || 0;

  if (now - last < 86400000) {
    return false;
  }

  database.users[id].saldo += 5000;
  database.daily[id] = now;

  saveDB();

  return true;
}

// =============================
// 🎮 COMANDOS
// =============================
function iniciar(client) {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const cmd = message.content.toLowerCase();
    const id = message.author.id;

    // SALDO
    if (cmd === '!saldo') {
      const saldo = getSaldo(id);
      return message.reply(`💰 Seu saldo: ${saldo}`);
    }

    // DAILY
    if (cmd === '!daily') {

      const ok = daily(id);

      if (!ok) {
        return message.reply('⏳ Já pegou hoje.');
      }

      return message.reply('🎁 +5000 moedas');
    }

  });

}

// =============================
// 📤 EXPORT
// =============================
module.exports = {
  iniciar,
  getSaldo,
  addMoney,
  removeMoney,
  setMoney,
  daily
};
