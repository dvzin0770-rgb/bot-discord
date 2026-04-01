const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// =============================
// 📁 CONFIG
// =============================
const DB_PATH = './economia.json';
const BACKUP_PATH = './economia_backup.json';
const ADMIN_ID = '1374388082908069899';

// =============================
// 🔒 CONTROLE
// =============================
let salvando = false;
let fila = [];

// =============================
// 🧠 GARANTIR DB
// =============================
function garantirDB() {
  if (!fs.existsSync(DB_PATH)) {
    const estrutura = {
      users: {},
      daily: {},
      meta: {
        criadoEm: Date.now(),
        versao: 2
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(estrutura, null, 2));
  }
}

// =============================
// 📖 LER DB
// =============================
function lerDB() {
  garantirDB();

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');

    if (!raw || raw.trim() === '') {
      return { users: {}, daily: {} };
    }

    const data = JSON.parse(raw);

    if (!data.users) data.users = {};
    if (!data.daily) data.daily = {};

    return data;

  } catch (err) {

    console.log('❌ ERRO DB:', err);

    if (fs.existsSync(BACKUP_PATH)) {
      console.log('🔄 RESTAURANDO BACKUP...');
      const backup = JSON.parse(fs.readFileSync(BACKUP_PATH));
      fs.writeFileSync(DB_PATH, JSON.stringify(backup, null, 2));
      return backup;
    }

    return { users: {}, daily: {} };
  }
}

// =============================
// 💾 SALVAR COM FILA
// =============================
function salvarDB(data) {

  fila.push(JSON.stringify(data, null, 2));

  if (salvando) return;

  processarFila();
}

function processarFila() {

  if (fila.length === 0) {
    salvando = false;
    return;
  }

  salvando = true;

  const data = fila.shift();

  try {
    fs.writeFileSync(BACKUP_PATH, data);
    fs.writeFileSync(DB_PATH, data);
  } catch (err) {
    console.log('❌ ERRO SALVAR:', err);
  }

  setTimeout(processarFila, 50);
}

// =============================
// 👤 GARANTIR USER
// =============================
function garantirUser(db, id) {

  if (!db.users[id]) {
    db.users[id] = {
      saldo: 10000,
      criadoEm: Date.now(),
      totalGanho: 0,
      totalPerdido: 0
    };
  }

}

// =============================
// 💰 GET
// =============================
function getSaldo(id) {
  const db = lerDB();
  garantirUser(db, id);
  return db.users[id].saldo;
}

// =============================
// ➕ ADD
// =============================
function addMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo += valor;
  db.users[id].totalGanho += valor;

  salvarDB(db);
}

// =============================
// ➖ REMOVE
// =============================
function removeMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo -= valor;
  db.users[id].totalPerdido += valor;

  if (db.users[id].saldo < 0) {
    db.users[id].saldo = 0;
  }

  salvarDB(db);
}

// =============================
// 🎯 SET
// =============================
function setMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo = valor;

  salvarDB(db);
}

// =============================
// 🎁 DAILY
// =============================
function daily(id) {

  const db = lerDB();
  garantirUser(db, id);

  const agora = Date.now();
  const ultimo = db.daily[id] || 0;

  if (agora - ultimo < 86400000) return false;

  db.users[id].saldo += 5000;
  db.daily[id] = agora;

  salvarDB(db);

  return true;
}

// =============================
// 🏆 TOP
// =============================
async function gerarRanking(client) {

  const db = lerDB();

  const ranking = Object.entries(db.users)
    .sort((a, b) => b[1].saldo - a[1].saldo)
    .slice(0, 10);

  let texto = '';

  for (let i = 0; i < ranking.length; i++) {

    const user = await client.users.fetch(ranking[i][0]).catch(() => null);

    const nome = user ? user.username : 'Desconhecido';

    const medalha =
      i === 0 ? '🥇' :
      i === 1 ? '🥈' :
      i === 2 ? '🥉' : `#${i + 1}`;

    texto += `${medalha} **${nome}** — 💰 ${ranking[i][1].saldo}\n`;
  }

  return texto;
}

// =============================
// 🎮 INICIAR COMANDOS
// =============================
function iniciar(client) {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const args = message.content.split(' ');
    const cmd = args[0].toLowerCase();
    const id = message.author.id;

    // SALDO
    if (cmd === '!saldo') {
      const saldo = getSaldo(id);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#22c55e')
            .setTitle('💰 SEU SALDO')
            .setDescription(`Você tem **${saldo} moedas**`)
        ]
      });
    }

    // DAILY
    if (cmd === '!daily') {
      const ok = daily(id);

      if (!ok) {
        return message.reply('⏳ Você já coletou hoje.');
      }

      return message.reply('🎁 +5000 moedas');
    }

    // ADD MONEY (ADMIN)
    if (cmd === '!addmoney') {

      if (id !== ADMIN_ID) {
        return message.reply('❌ Sem permissão.');
      }

      const alvo = message.mentions.users.first();
      const valor = Number(args[2]);

      if (!alvo || !valor) {
        return message.reply('❌ Use: !addmoney @user valor');
      }

      addMoney(alvo.id, valor);

      return message.reply(`💰 ${alvo.username} recebeu ${valor}`);
    }

    // TOP
    if (cmd === '!topricos') {
      const texto = await gerarRanking(client);

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 TOP RICOS')
            .setDescription(texto)
        ]
      });
    }

  });

}

// =============================
// 📤 EXPORTS CORRETOS
// =============================
module.exports = {
  iniciar,
  getSaldo,
  addMoney,
  removeMoney,
  setMoney
};
