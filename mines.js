const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = './economia.json';

// ==========================
// 📁 BANCO
// ==========================
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

// ==========================
// 💣 GERAR GRID
// ==========================
function gerarGrid(minas) {
  const grid = Array(25).fill('💎'); // 5x5 INSANO

  let colocadas = 0;
  while (colocadas < minas) {
    const i = Math.floor(Math.random() * 25);
    if (grid[i] !== '💣') {
      grid[i] = '💣';
      colocadas++;
    }
  }

  return grid;
}

// ==========================
// 📈 MULTIPLICADOR REAL
// ==========================
function calcularMultiplicador(seguras, minas) {
  const total = 25;
  const chance = (total - minas) / total;

  return (1 / chance) * (seguras * 0.25 + 1);
}

// ==========================
// 🎨 EMBED
// ==========================
function criarEmbed(jogo, saldo) {
  const ganho = Math.floor(jogo.aposta * jogo.multiplicador);

  return new EmbedBuilder()
    .setTitle('💣 MINES INSANO — FROSTVOW')
    .setDescription(
      `💰 Aposta: ${jogo.aposta}\n` +
      `💣 Minas: ${jogo.minas}\n` +
      `📈 Mult: x${jogo.multiplicador.toFixed(2)}\n` +
      `💎 Seguro: ${jogo.seguras}\n` +
      `💵 Possível: ${ganho}\n` +
      `💳 Saldo: ${saldo}`
    )
    .setColor('#111827');
}

// ==========================
// 🔘 BOTÕES GRID
// ==========================
function gerarBotoes(jogo) {
  const rows = [];

  for (let i = 0; i < 5; i++) {
    const row = new ActionRowBuilder();

    for (let j = 0; j < 5; j++) {
      const index = i * 5 + j;

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mine_${index}`)
          .setLabel(jogo.revelados[index] ? jogo.grid[index] : '⬛')
          .setStyle(
            jogo.revelados[index]
              ? (jogo.grid[index] === '💣' ? ButtonStyle.Danger : ButtonStyle.Success)
              : ButtonStyle.Secondary
          )
          .setDisabled(jogo.revelados[index] || !jogo.ativo)
      );
    }

    rows.push(row);
  }

  // CONTROLES
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sacar')
        .setLabel('💰 Sacar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!jogo.ativo),

      new ButtonBuilder()
        .setCustomId('replay')
        .setLabel('🔁 Jogar de novo')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return rows;
}

// ==========================
// 💣 SISTEMA
// ==========================
module.exports = (client) => {

  const jogos = new Map();

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!mines')) return;

    const args = message.content.split(' ');
    const minas = Number(args[1]);
    const aposta = Number(args[2]);
    const id = message.author.id;

    if (!minas || !aposta) {
      return message.reply('❌ Use: !mines <minas> <aposta>');
    }

    if (minas < 1 || minas > 10) {
      return message.reply('❌ Minas: 1 até 10');
    }

    const db = getDB();

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (aposta > db.users[id]) {
      return message.reply(
        `💸 Saldo: ${db.users[id]}\nComo você vai apostar isso? 🤨`
      );
    }

    db.users[id] -= aposta;
    saveDB(db);

    const jogo = {
      grid: gerarGrid(minas),
      revelados: Array(25).fill(false),
      minas,
      aposta,
      multiplicador: 1,
      seguras: 0,
      ativo: true
    };

    jogos.set(id, jogo);

    const msg = await message.channel.send({
      embeds: [criarEmbed(jogo, db.users[id])],
      components: gerarBotoes(jogo)
    });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== id) {
        return interaction.reply({
          content: '❌ Não é seu jogo.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      const jogo = jogos.get(id);
      if (!jogo) return;

      // 🔁 REPLAY
      if (interaction.customId === 'replay') {
        return message.channel.send(`🎮 Use novamente: !mines ${jogo.minas} ${jogo.aposta}`);
      }

      if (!jogo.ativo) return;

      // 💰 SACAR
      if (interaction.customId === 'sacar') {
        const ganho = Math.floor(jogo.aposta * jogo.multiplicador);

        const db = getDB();
        db.users[id] += ganho;
        saveDB(db);

        jogo.ativo = false;

        return msg.edit({
          content: `💰 Sacou ${ganho}!`,
          embeds: [],
          components: []
        });
      }

      const index = parseInt(interaction.customId.split('_')[1]);

      if (jogo.grid[index] === '💣') {
        jogo.ativo = false;
        jogo.revelados = jogo.grid.map(() => true);

        return msg.edit({
          content: '💣 BOOM! Você perdeu!',
          embeds: [],
          components: gerarBotoes(jogo)
        });
      }

      jogo.revelados[index] = true;
      jogo.seguras++;

      jogo.multiplicador = calcularMultiplicador(jogo.seguras, jogo.minas);

      const db = getDB();

      await msg.edit({
        embeds: [criarEmbed(jogo, db.users[id])],
        components: gerarBotoes(jogo)
      });
    });

  });

};
