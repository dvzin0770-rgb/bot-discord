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
      stats: {}
    }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH));

  if (!data.users) data.users = {};
  if (!data.daily) data.daily = {};
  if (!data.stats) data.stats = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ==========================
// 📊 SISTEMA DE STREAK
// ==========================
function getStats(db, id) {
  if (!db.stats[id]) {
    db.stats[id] = {
      winStreak: 0,
      loseStreak: 0,
      totalWins: 0,
      totalLoses: 0
    };
  }
  return db.stats[id];
}

// ==========================
// 🎲 RESULTADO
// ==========================
function jogarMoeda() {
  return Math.random() < 0.5 ? 'cara' : 'coroa';
}

// ==========================
// 💰 CALCULAR GANHO
// ==========================
function calcularGanho(aposta, ganhou, streak) {
  if (!ganhou) return -aposta;

  let multiplicador = 2;

  // bônus por sequência
  if (streak >= 3) multiplicador += 0.5;
  if (streak >= 5) multiplicador += 1;

  return Math.floor(aposta * multiplicador);
}

// ==========================
// 🎨 EMBED
// ==========================
function criarEmbed(resultado, escolha, aposta, ganho, saldo, stats) {
  const win = ganho > 0;

  return new EmbedBuilder()
    .setTitle('🪙 COINFLIP INSANO — FROSTVOW')
    .setDescription(
      `🎯 **Você escolheu:** ${escolha}\n` +
      `🪙 **Resultado:** ${resultado}\n\n` +
      `${win ? '✅ Você ganhou!' : '❌ Você perdeu!'}\n\n` +
      `💰 **Aposta:** ${aposta}\n` +
      `🏆 **Resultado:** ${ganho}\n` +
      `💳 **Saldo:** ${saldo}\n\n` +
      `🔥 **Win Streak:** ${stats.winStreak}\n` +
      `💀 **Lose Streak:** ${stats.loseStreak}`
    )
    .setColor(win ? '#22c55e' : '#ef4444')
    .setFooter({ text: 'Continue jogando para aumentar o streak 🔥' });
}

// ==========================
// 🔁 BOTÕES
// ==========================
function criarBotoes(aposta) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`coin_cara_${aposta}`)
        .setLabel('Cara')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`coin_coroa_${aposta}`)
        .setLabel('Coroa')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`coin_double_${aposta}`)
        .setLabel('🔥 Dobrar')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

// ==========================
// 🪙 SISTEMA PRINCIPAL
// ==========================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!coinflip')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const escolha = args[2]?.toLowerCase();
    const id = message.author.id;

    if (!aposta || aposta <= 0) {
      return message.reply('❌ Use: !coinflip <valor> <cara/coroa>');
    }

    if (!['cara', 'coroa'].includes(escolha)) {
      return message.reply('❌ Escolha cara ou coroa.');
    }

    const db = getDB();

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (aposta > db.users[id]) {
      return message.reply(`💸 Você só tem ${db.users[id]} moedas.`);
    }

    const stats = getStats(db, id);

    // 🎲 RESULTADO
    const resultado = jogarMoeda();
    const ganhou = resultado === escolha;

    const ganho = calcularGanho(aposta, ganhou, stats.winStreak);

    // 💰 APLICA RESULTADO
    db.users[id] += ganho;

    // 📊 ATUALIZA STATS
    if (ganhou) {
      stats.winStreak++;
      stats.loseStreak = 0;
      stats.totalWins++;
    } else {
      stats.loseStreak++;
      stats.winStreak = 0;
      stats.totalLoses++;
    }

    saveDB(db);

    const embed = criarEmbed(
      resultado,
      escolha,
      aposta,
      ganho,
      db.users[id],
      stats
    );

    const msg = await message.channel.send({
      embeds: [embed],
      components: criarBotoes(aposta)
    });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== id) {
        return interaction.reply({
          content: '❌ Esse jogo não é seu.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      let novaAposta = aposta;
      let novaEscolha = escolha;

      if (interaction.customId.startsWith('coin_double')) {
        novaAposta = aposta * 2;
      }

      if (interaction.customId.includes('cara')) novaEscolha = 'cara';
      if (interaction.customId.includes('coroa')) novaEscolha = 'coroa';

      const db = getDB();

      if (novaAposta > db.users[id]) {
        return interaction.followUp({
          content: `💸 Saldo insuficiente: ${db.users[id]}`,
          ephemeral: true
        });
      }

      const stats = getStats(db, id);

      const resultado = jogarMoeda();
      const ganhou = resultado === novaEscolha;

      const ganho = calcularGanho(novaAposta, ganhou, stats.winStreak);

      db.users[id] += ganho;

      if (ganhou) {
        stats.winStreak++;
        stats.loseStreak = 0;
        stats.totalWins++;
      } else {
        stats.loseStreak++;
        stats.winStreak = 0;
        stats.totalLoses++;
      }

      saveDB(db);

      const embed = criarEmbed(
        resultado,
        novaEscolha,
        novaAposta,
        ganho,
        db.users[id],
        stats
      );

      await msg.edit({
        embeds: [embed],
        components: criarBotoes(novaAposta)
      });
    });

  });

};
