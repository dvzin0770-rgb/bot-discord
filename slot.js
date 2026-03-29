const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

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

// 🎰 símbolos
const simbolos = ['🍒','🍋','🍇','💎','🔥','👑'];

function girar() {
  return [
    simbolos[Math.floor(Math.random() * simbolos.length)],
    simbolos[Math.floor(Math.random() * simbolos.length)],
    simbolos[Math.floor(Math.random() * simbolos.length)]
  ];
}

function calcular(resultado, aposta) {
  const [a, b, c] = resultado;

  // 👑 JACKPOT
  if (a === '👑' && b === '👑' && c === '👑') {
    return { ganho: aposta * 15, msg: '👑 JACKPOT INSANO x15' };
  }

  // 💎 SUPER
  if (a === '💎' && b === '💎' && c === '💎') {
    return { ganho: aposta * 10, msg: '💎 SUPER JACKPOT x10' };
  }

  // 🔥 trio
  if (a === b && b === c) {
    return { ganho: aposta * 5, msg: '🔥 TRIO PERFEITO x5' };
  }

  // dupla
  if (a === b || b === c || a === c) {
    return { ganho: aposta * 2, msg: '✨ DUPLA x2' };
  }

  return { ganho: 0, msg: '💀 Perdeu tudo...' };
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!slot')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);

    if (!aposta) {
      return message.reply('❌ Use: !slot <aposta>');
    }

    const db = getDB();
    const id = message.author.id;

    if (db.users[id] === undefined) {
      db.users[id] = 10000;
      saveDB(db);
    }

    if (db.users[id] < aposta) {
      return message.reply(
        `💸 Seu saldo é **${db.users[id]} moedas**.\nComo vai apostar isso? 🤨`
      );
    }

    db.users[id] -= aposta;
    saveDB(db);

    const embed = new EmbedBuilder()
      .setTitle('🎰 SLOT — GIRANDO...')
      .setDescription('`❔ ❔ ❔`')
      .setColor('#2b2d31');

    const msg = await message.channel.send({ embeds: [embed] });

    // ⏳ animação fake
    await new Promise(r => setTimeout(r, 1000));
    await msg.edit({
      embeds: [embed.setDescription('`🍒 ❔ ❔`')]
    });

    await new Promise(r => setTimeout(r, 1000));
    await msg.edit({
      embeds: [embed.setDescription('`🍒 🍋 ❔`')]
    });

    await new Promise(r => setTimeout(r, 1000));

    const resultado = girar();
    const { ganho, msg: resultadoMsg } = calcular(resultado, aposta);

    db.users[id] += ganho;
    saveDB(db);

    const final = new EmbedBuilder()
      .setTitle('🎰 SLOT — RESULTADO')
      .setDescription(
        `\`${resultado.join(' ')}\`\n\n` +
        `${resultadoMsg}\n\n` +
        `💰 Aposta: ${aposta}\n` +
        `💎 Ganho: ${ganho}\n` +
        `🏦 Saldo: ${db.users[id]}`
      )
      .setColor(ganho > 0 ? '#00ff88' : '#ff3b3b')
      .setFooter({ text: 'Tente sua sorte novamente...' });

    msg.edit({ embeds: [final] });

  });

};
