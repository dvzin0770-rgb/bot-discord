const fs = require('fs');

const DB_PATH = './economia.json';

// =============================
// 📥 CARREGAR DB NA MEMÓRIA
// =============================
let db = { users: {}, daily: {} };

if (fs.existsSync(DB_PATH)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH));
  } catch {
    db = { users: {}, daily: {} };
  }
}

// =============================
// 💾 SALVAR
// =============================
function salvar() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// =============================
// 👤 GARANTIR USER
// =============================
function garantirUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      saldo: 10000,
      totalGanho: 0,
      totalPerdido: 0
    };
  }
}

// =============================
// 💰 GET
// =============================
function getSaldo(id) {
  garantirUser(id);
  return db.users[id].saldo;
}

// =============================
// ➕ ADD
// =============================
function addMoney(id, valor) {
  garantirUser(id);
  db.users[id].saldo += valor;
  db.users[id].totalGanho += valor;
  salvar();
}

// =============================
// ➖ REMOVE
// =============================
function removeMoney(id, valor) {
  garantirUser(id);
  db.users[id].saldo -= valor;
  db.users[id].totalPerdido += valor;

  if (db.users[id].saldo < 0) {
    db.users[id].saldo = 0;
  }

  salvar();
}

// =============================
// 🎁 DAILY
// =============================
function daily(id) {
  garantirUser(id);

  const agora = Date.now();
  const ultimo = db.daily[id] || 0;

  if (agora - ultimo < 86400000) return false;

  db.users[id].saldo += 5000;
  db.daily[id] = agora;

  salvar();
  return true;
}

// =============================
// 📤 EXPORTS
// =============================
module.exports = {
  getSaldo,
  addMoney,
  removeMoney,
  daily
};
