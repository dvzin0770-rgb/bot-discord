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
      roletaStats: {}
    }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH));

  if (!data.users) data.users = {};
  if (!data.daily) data.daily = {};
  if (!data.roletaStats) data.roletaStats = {};

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ==========================
// 🎡 CONFIG ROLETA
// ==========================
const cores = [
  { nome: 'red', emoji: '🔴', peso: 48 },
  { nome: 'black', emoji: '⚫', peso: 48 },
  { nome: 'green', emoji: '🟢', peso: 4 } // raro
];

// ==========================
// 🎲 SORTEIO COM PESO
// ==========================
function girarRoleta() {
  const total = cores.reduce((acc, c) => acc + c.peso, 0);
  const rand = Math.random() * total;

  let soma = 0;

  for (const cor of cores) {
    soma += cor.peso;
    if (rand <= soma) return cor;
  }
}

// ==========================
// 💰 MULTIPLICADORES
// ==========================
function calcularGanho(corEscolhida, resultado, aposta) {
  if (corEscolhida !== resultado.nome) return -aposta;

  if (resultado.nome === 'green') return aposta * 14;
  return aposta * 2;
}

// ==========================
// 📊 STATS
// ==========================
function getStats(db, id) {
  if (!db.roletaStats[id]) {
    db.roletaStats[id] = {
      wins: 0,
      loses: 0,
      total: 0
    };
  }
  return db.roletaStats[id];
}

// ==========================
// 🎨 EMBED
// ==========================
function criarEmbed(resultado, escolha, aposta, ganho, saldo, stats) {
  const win = ganho > 0;

  return new EmbedBuilder()
    .setTitle('🎡 ROLETA INSANA — FROSTVOW')
    .setDescription(
      `🎯 **Você apostou:** ${escolha}\n` +
      `🎡 **Resultado:** ${resultado.emoji} (${resultado.nome})\n\n` +
      `${win ? '✅ GANHOU!' : '❌ PERDEU!'}\n\n` +
      `💰 **Aposta:** ${aposta}\n` +
      `🏆 **Resultado:** ${ganho}\n` +
      `💳 **Saldo:** ${saldo}\n\n` +
      `📊 **Vitórias:** ${stats.wins}\n` +
      `📉 **Derrotas:** ${stats.loses}`
    )
    .setColor(
      resultado.nome === 'green' ? '#22c55e' :
      resultado.nome === 'red' ? '#ef4444' : '#000000'
    )
    .setFooter({ text: 'Boa sorte na próxima rodada 🎡' });
}

// ==========================
// 🔁 BOTÕES
// ==========================
function criarBotoes(aposta) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`roleta_red_${aposta}`)
        .setLabel('🔴 Red')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`roleta_black_${aposta}`)
        .setLabel('⚫ Black')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`roleta_green_${aposta}`)
        .setLabel('🟢 Green')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`roleta_double_${aposta}`)
        .setLabel('🔥 Dobrar')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

// ==========================
// 🎡 SISTEMA PRINCIPAL
// ==========================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!roleta')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const escolha = args[2]?.toLowerCase();
    const id = message.author.id;

    if (!aposta || aposta <= 0) {
      return message.reply('❌ Use: !roleta <valor> <red/black/green>');
    }

    if (!['red', 'black', 'green'].includes(escolha)) {
      return message.reply('❌ Escolha: red, black ou green');
    }

    const db = getDB();

    if (db.users[id] === undefined) db.users[id] = 10000;

    if (aposta > db.users[id]) {
      return message.reply(`💸 Saldo: ${db.users[id]}`);
    }

    const stats = getStats(db, id);

    const resultado = girarRoleta();
    const ganho = calcularGanho(escolha, resultado, aposta);

    db.users[id] += ganho;

    stats.total++;
    ganho > 0 ? stats.wins++ : stats.loses++;

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
          content: '❌ Não é seu jogo.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      let novaAposta = aposta;
      let novaEscolha = escolha;

      if (interaction.customId.includes('double')) {
        novaAposta = aposta * 2;
      }

      if (interaction.customId.includes('red')) novaEscolha = 'red';
      if (interaction.customId.includes('black')) novaEscolha = 'black';
      if (interaction.customId.includes('green')) novaEscolha = 'green';

      const db = getDB();

      if (novaAposta > db.users[id]) {
        return interaction.followUp({
          content: `💸 Você tem ${db.users[id]}`,
          ephemeral: true
        });
      }

      const stats = getStats(db, id);

      const resultado = girarRoleta();
      const ganho = calcularGanho(novaEscolha, resultado, novaAposta);

      db.users[id] += ganho;

      stats.total++;
      ganho > 0 ? stats.wins++ : stats.loses++;

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
