const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ===============================
// 📁 CONFIG
// ===============================
const DB_PATH = './economia.json';
const ADMIN_ID = '1374388082908069899';

// ===============================
// 🔒 CONTROLE DE ESCRITA
// ===============================
let salvando = false;
let ultimoSave = 0;

// ===============================
// 🧠 INICIALIZAÇÃO SEGURA
// ===============================
function garantirDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      daily: {},
      meta: {
        criadoEm: Date.now()
      }
    }, null, 2));
  }
}

// ===============================
// 📖 LEITURA ULTRA SEGURA
// ===============================
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
    console.log('❌ ERRO AO LER DB:', err);
    return { users: {}, daily: {} };
  }
}

// ===============================
// 💾 SAVE PROTEGIDO
// ===============================
function salvarDB(data) {
  const agora = Date.now();

  if (salvando) return;
  if (agora - ultimoSave < 500) return;

  salvando = true;

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    ultimoSave = agora;
  } catch (err) {
    console.log('❌ ERRO AO SALVAR:', err);
  }

  salvando = false;
}

// ===============================
// 👤 USUÁRIO
// ===============================
function garantirUser(db, id) {
  if (!db.users[id]) {
    db.users[id] = {
      saldo: 10000,
      criadoEm: Date.now()
    };
  }
}

// ===============================
// 💰 PEGAR SALDO
// ===============================
function getSaldo(id) {
  const db = lerDB();
  garantirUser(db, id);
  salvarDB(db);
  return db.users[id].saldo;
}

// ===============================
// ➕ ADD MONEY
// ===============================
function addMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo += valor;

  salvarDB(db);
}

// ===============================
// ➖ REMOVE MONEY
// ===============================
function removeMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo -= valor;

  if (db.users[id].saldo < 0) {
    db.users[id].saldo = 0;
  }

  salvarDB(db);
}

// ===============================
// 🎯 SET MONEY
// ===============================
function setMoney(id, valor) {
  const db = lerDB();
  garantirUser(db, id);

  db.users[id].saldo = valor;

  salvarDB(db);
}

// ===============================
// 🏆 TOP RICOS
// ===============================
async function gerarTop(client) {
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

// ===============================
// 🎮 SISTEMA DE COMANDOS
// ===============================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const cmd = args[0].toLowerCase();
    const id = message.author.id;

    // ================= SALDO
    if (cmd === '!saldo') {
      const saldo = getSaldo(id);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#22c55e')
            .setTitle('💰 SEU SALDO')
            .setDescription(`Você possui **${saldo} moedas**`)
        ]
      });
    }

    // ================= ADDMONEY (SÓ VOCÊ)
    if (cmd === '!addmoney') {

      if (id !== ADMIN_ID) {
        return message.reply('❌ Só o dono pode usar.');
      }

      const alvo = message.mentions.users.first();
      const valor = Number(args[2]);

      if (!alvo || !valor) {
        return message.reply('❌ Use: !addmoney @user valor');
      }

      addMoney(alvo.id, valor);

      return message.reply(`💰 Adicionado ${valor} para ${alvo.username}`);
    }

    // ================= TOP RICOS
    if (cmd === '!topricos') {

      const texto = await gerarTop(client);

      const pos = Object.entries(lerDB().users)
        .sort((a, b) => b[1].saldo - a[1].saldo)
        .findIndex(u => u[0] === id);

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 RANKING DE RICOS')
            .setDescription(texto)
            .addFields({
              name: '📍 Sua posição',
              value: pos !== -1 ? `#${pos + 1}` : 'Fora do ranking'
            })
        ]
      });
    }

  });

};
