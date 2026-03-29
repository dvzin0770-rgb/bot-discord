const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = './economia.json';

// ==========================
// 📁 BANCO DE DADOS
// ==========================
function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      daily: {},
      bjStats: {}
    }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH));

  if (!data.users) data.users = {};
  if (!data.daily) data.daily = {};
  if (!data.bjStats) data.bjStats = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ==========================
// 🃏 CARTAS
// ==========================
const cartas = [
  'A','2','3','4','5','6','7','8','9','10','J','Q','K'
];

function puxarCarta() {
  return cartas[Math.floor(Math.random() * cartas.length)];
}

// ==========================
// 📊 VALOR DA MÃO
// ==========================
function calcularValor(mao) {
  let total = 0;
  let ases = 0;

  for (const carta of mao) {
    if (carta === 'A') {
      ases++;
      total += 11;
    } else if (['J','Q','K'].includes(carta)) {
      total += 10;
    } else {
      total += Number(carta);
    }
  }

  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }

  return total;
}

// ==========================
// 🤖 DEALER INTELIGENTE
// ==========================
function jogarDealer(mao) {
  while (calcularValor(mao) < 17) {
    mao.push(puxarCarta());
  }
  return mao;
}

// ==========================
// 📊 STATS
// ==========================
function getStats(db, id) {
  if (!db.bjStats[id]) {
    db.bjStats[id] = {
      wins: 0,
      loses: 0,
      draws: 0
    };
  }
  return db.bjStats[id];
}

// ==========================
// 🎨 EMBED
// ==========================
function criarEmbed(player, dealer, aposta, estado, saldo, stats, hidden = true) {
  const valorPlayer = calcularValor(player);
  const valorDealer = calcularValor(dealer);

  const dealerView = hidden
    ? `${dealer[0]} ❓`
    : `${dealer.join(' ')} (${valorDealer})`;

  return new EmbedBuilder()
    .setTitle('🃏 BLACKJACK INSANO — FROSTVOW')
    .setDescription(
      `👤 **Sua mão:** ${player.join(' ')} (${valorPlayer})\n` +
      `🤖 **Dealer:** ${dealerView}\n\n` +
      `💰 **Aposta:** ${aposta}\n` +
      `💳 **Saldo:** ${saldo}\n\n` +
      `📊 **W:** ${stats.wins} | L: ${stats.loses} | D: ${stats.draws}\n\n` +
      `📌 ${estado}`
    )
    .setColor('#0ea5e9');
}

// ==========================
// 🔘 BOTÕES
// ==========================
function botoes(ativo = true) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('hit')
        .setLabel('🟢 Hit')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!ativo),

      new ButtonBuilder()
        .setCustomId('stand')
        .setLabel('🛑 Stand')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!ativo),

      new ButtonBuilder()
        .setCustomId('double')
        .setLabel('💥 Double')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!ativo)
    )
  ];
}

// ==========================
// 🃏 SISTEMA PRINCIPAL
// ==========================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!blackjack')) return;

    const args = message.content.split(' ');
    let aposta = Number(args[1]);
    const id = message.author.id;

    if (!aposta || aposta <= 0) {
      return message.reply('❌ Use: !blackjack <valor>');
    }

    const db = getDB();

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (aposta > db.users[id]) {
      return message.reply(`💸 Saldo: ${db.users[id]}`);
    }

    db.users[id] -= aposta;
    saveDB(db);

    const stats = getStats(db, id);

    let player = [puxarCarta(), puxarCarta()];
    let dealer = [puxarCarta(), puxarCarta()];

    let ativo = true;

    const msg = await message.channel.send({
      embeds: [
        criarEmbed(player, dealer, aposta, 'Sua vez...', db.users[id], stats)
      ],
      components: botoes(true)
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== id) {
        return interaction.reply({
          content: '❌ Não é seu jogo.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      if (!ativo) return;

      // ================= HIT
      if (interaction.customId === 'hit') {
        player.push(puxarCarta());

        if (calcularValor(player) > 21) {
          ativo = false;
          stats.loses++;
          saveDB(db);

          return msg.edit({
            embeds: [
              criarEmbed(player, dealer, aposta, '💥 Estourou!', db.users[id], stats, false)
            ],
            components: botoes(false)
          });
        }
      }

      // ================= DOUBLE
      if (interaction.customId === 'double') {
        if (db.users[id] < aposta) return;

        db.users[id] -= aposta;
        aposta *= 2;

        player.push(puxarCarta());
        ativo = false;
      }

      // ================= STAND
      if (interaction.customId === 'stand' || !ativo) {

        dealer = jogarDealer(dealer);

        const p = calcularValor(player);
        const d = calcularValor(dealer);

        let resultado = '';
        let ganho = 0;

        if (p > 21) {
          resultado = '💥 Você perdeu!';
          stats.loses++;
        } else if (d > 21 || p > d) {
          ganho = aposta * 2;
          db.users[id] += ganho;
          resultado = '✅ Você ganhou!';
          stats.wins++;
        } else if (p === d) {
          db.users[id] += aposta;
          resultado = '⚖️ Empate!';
          stats.draws++;
        } else {
          resultado = '❌ Você perdeu!';
          stats.loses++;
        }

        saveDB(db);
        ativo = false;

        return msg.edit({
          embeds: [
            criarEmbed(player, dealer, aposta, resultado, db.users[id], stats, false)
          ],
          components: botoes(false)
        });
      }

      await msg.edit({
        embeds: [
          criarEmbed(player, dealer, aposta, 'Sua vez...', db.users[id], stats)
        ],
        components: botoes(true)
      });
    });

  });

};
