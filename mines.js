const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const eco = require('./economia');

// ==============================
// 🧠 SISTEMA GLOBAL
// ==============================
const jogos = new Map();

// ==============================
// 🎲 GERAR GRID
// ==============================
function gerarGrid(minas) {
  const grid = Array(16).fill('💎');

  let colocadas = 0;

  while (colocadas < minas) {
    const i = Math.floor(Math.random() * 16);
    if (grid[i] !== '💣') {
      grid[i] = '💣';
      colocadas++;
    }
  }

  return grid;
}

// ==============================
// 📈 MULTIPLICADOR
// ==============================
function calcMulti(revelados, minas) {
  const base = 1 + (revelados * 0.35);
  const risco = 1 + (minas * 0.25);
  return base * risco;
}

// ==============================
// 🎨 EMBED
// ==============================
function criarEmbed(user, jogo, saldo) {
  return new EmbedBuilder()
    .setColor('#0f172a')
    .setTitle('💣 MINES ULTRA — FROSTVOW')
    .setDescription(
      `👤 ${user}\n\n` +
      `💸 Aposta: **${jogo.aposta}**\n` +
      `💣 Minas: **${jogo.minas}**\n` +
      `📈 Multiplicador: **x${jogo.multi.toFixed(2)}**\n` +
      `💰 Possível ganho: **${Math.floor(jogo.aposta * jogo.multi)}**\n\n` +
      `🏦 Saldo: **${saldo}**`
    )
    .setFooter({ text: 'Clique nos blocos ou saque antes de explodir.' });
}

// ==============================
// 🔘 BOTÕES
// ==============================
function criarBotoes(jogo, userId) {

  const rows = [];

  for (let i = 0; i < 4; i++) {

    const row = new ActionRowBuilder();

    for (let j = 0; j < 4; j++) {

      const index = i * 4 + j;

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mine_${userId}_${index}`)
          .setLabel(jogo.revelados[index] ? jogo.grid[index] : '⬛')
          .setStyle(jogo.revelados[index] ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(jogo.revelados[index] || !jogo.ativo)
      );
    }

    rows.push(row);
  }

  const controle = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sacar_${userId}`)
      .setLabel('💰 Sacar')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!jogo.ativo),

    new ButtonBuilder()
      .setCustomId(`replay_${userId}`)
      .setLabel('🔁 Jogar Novamente')
      .setStyle(ButtonStyle.Primary)
  );

  rows.push(controle);

  return rows;
}

// ==============================
// 🎮 COMANDO
// ==============================
module.exports = (client) => {

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith('!mines')) return;

  const args = message.content.split(' ');
  const minas = Number(args[1]);
  const aposta = Number(args[2]);
  const id = message.author.id;

  // ==============================
  // VALIDAÇÃO
  // ==============================
  if (!minas || minas < 1 || minas > 10) {
    return message.reply('❌ Minas entre 1 e 10.');
  }

  if (!aposta || aposta <= 0) {
    return message.reply('❌ Aposta inválida.');
  }

  const saldo = eco.getSaldo(id);

  if (aposta > saldo) {
    return message.reply(`💸 Seu saldo é **${saldo}**.`);
  }

  // ==============================
  // 💸 REMOVE DINHEIRO
  // ==============================
  eco.removeMoney(id, aposta);

  // ==============================
  // INICIAR JOGO
  // ==============================
  const jogo = {
    grid: gerarGrid(minas),
    revelados: Array(16).fill(false),
    minas,
    aposta,
    multi: 1,
    ativo: true,
    cliques: 0
  };

  jogos.set(id, jogo);

  const msg = await message.channel.send({
    embeds: [criarEmbed(message.author.username, jogo, eco.getSaldo(id))],
    components: criarBotoes(jogo, id)
  });

  const collector = msg.createMessageComponentCollector({ time: 300000 });

  // ==============================
  // INTERAÇÕES
  // ==============================
  collector.on('collect', async (i) => {

    if (i.user.id !== id) {
      return i.reply({ content: '❌ Não é seu jogo.', ephemeral: true });
    }

    await i.deferUpdate();

    const jogo = jogos.get(id);
    if (!jogo) return;

    // ==============================
    // SACAR
    // ==============================
    if (i.customId.startsWith('sacar')) {

      if (!jogo.ativo) return;

      const ganho = Math.floor(jogo.aposta * jogo.multi);

      eco.addMoney(id, ganho);

      jogo.ativo = false;
      jogo.revelados = jogo.grid.map(() => true);

      return msg.edit({
        content: `💰 Você sacou **${ganho} moedas!**`,
        embeds: [criarEmbed(message.author.username, jogo, eco.getSaldo(id))],
        components: criarBotoes(jogo, id)
      });
    }

    // ==============================
    // REPLAY
    // ==============================
    if (i.customId.startsWith('replay')) {
      jogos.delete(id);
      return msg.delete().catch(() => null);
    }

    // ==============================
    // CLIQUE
    // ==============================
    const index = parseInt(i.customId.split('_')[2]);

    if (jogo.revelados[index]) return;

    jogo.revelados[index] = true;
    jogo.cliques++;

    // ==============================
    // BOMBA
    // ==============================
    if (jogo.grid[index] === '💣') {

      jogo.ativo = false;
      jogo.revelados = jogo.grid.map(() => true);

      return msg.edit({
        content: '💣 BOOM! Você perdeu tudo!',
        embeds: [criarEmbed(message.author.username, jogo, eco.getSaldo(id))],
        components: criarBotoes(jogo, id)
      });
    }

    // ==============================
    // SAFE
    // ==============================
    jogo.multi = calcMulti(jogo.cliques, jogo.minas);

    return msg.edit({
      embeds: [criarEmbed(message.author.username, jogo, eco.getSaldo(id))],
      components: criarBotoes(jogo, id)
    });

  });

  // ==============================
  // FINALIZAÇÃO
  // ==============================
  collector.on('end', () => {
    jogos.delete(id);
  });

});

};
