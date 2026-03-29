const fs = require('fs');

const DB_PATH = './economia.json';

// =========================
// 🔒 LOCK (ANTI CORRUPÇÃO)
// =========================
let salvando = false;

// =========================
// 📦 CRIAR DB SE NÃO EXISTIR
// =========================
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      daily: {}
    }, null, 2));
  }
}

// =========================
// 📖 LER DB COM SEGURANÇA
// =========================
function getDB() {
  initDB();

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');

    // 🔥 PROTEÇÃO CONTRA ARQUIVO VAZIO
    if (!raw || raw.trim() === '') {
      return { users: {}, daily: {} };
    }

    const data = JSON.parse(raw);

    // 🔥 GARANTE ESTRUTURA
    if (!data.users) data.users = {};
    if (!data.daily) data.daily = {};

    return data;

  } catch (err) {
    console.log('❌ ERRO AO LER DB:', err);

    return { users: {}, daily: {} };
  }
}

// =========================
// 💾 SALVAR COM PROTEÇÃO
// =========================
function saveDB(data) {

  if (salvando) return;
  salvando = true;

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('❌ ERRO AO SALVAR DB:', err);
  }

  salvando = false;
}

// =========================
// 👤 PEGAR USUÁRIO
// =========================
function getUser(id) {
  const db = getDB();

  if (!db.users[id]) {
    db.users[id] = 10000; // saldo inicial
    saveDB(db);
  }

  return db.users[id];
}

// =========================
// ➕ ADICIONAR
// =========================
function addMoney(id, valor) {
  const db = getDB();

  if (!db.users[id]) db.users[id] = 10000;

  db.users[id] += valor;

  saveDB(db);
}

// =========================
// ➖ REMOVER
// =========================
function removeMoney(id, valor) {
  const db = getDB();

  if (!db.users[id]) db.users[id] = 10000;

  db.users[id] -= valor;

  if (db.users[id] < 0) db.users[id] = 0;

  saveDB(db);
}

// =========================
// 💰 DEFINIR (ADMIN)
// =========================
function setMoney(id, valor) {
  const db = getDB();

  db.users[id] = valor;

  saveDB(db);
}

// =========================
// 📊 SALDO
// =========================
function getMoney(id) {
  const db = getDB();

  if (!db.users[id]) {
    db.users[id] = 10000;
    saveDB(db);
  }

  return db.users[id];
}

module.exports = {
  getMoney,
  addMoney,
  removeMoney,
  setMoney,
  getDB
};
