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
  if (!data.daily) data.daily = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getSaldo(id) {
  const db = getDB();

  if (db.users[id] === undefined) {
    db.users[id] = 10000;
    saveDB(db);
  }

  return db.users[id];
}

function addSaldo(id, valor) {
  const db = getDB();

  if (db.users[id] === undefined) {
    db.users[id] = 0;
  }

  db.users[id] += valor;
  saveDB(db);
}

function removeSaldo(id, valor) {
  const db = getDB();

  if (db.users[id] === undefined) {
    db.users[id] = 0;
  }

  db.users[id] -= valor;
  saveDB(db);
}

module.exports = { getSaldo, addSaldo, removeSaldo };
