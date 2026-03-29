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

// ==========================
// 🎰 CONFIGURAÇÕES
// ==========================
const simbolos = [
  { emoji: '🍒', peso: 30 },
  { emoji: '🍋', peso: 25 },
  { emoji: '🍇', peso: 20 },
  { emoji: '💎', peso: 10 },
  { emoji: '🔥', peso: 8 },
  { emoji: '👑', peso: 5 },
  { emoji: '💀', peso: 2 } // símbolo raro (jackpot)
];

// ==========================
// 🎲 RANDOM COM PESO
// ==========================
function pegarSimbolo() {
  const total = simbolos.reduce((acc, s) => acc + s.peso, 0);
  const rand = Math.random() * total;

  let soma = 0;

  for (const s of simbolos) {
    soma += s.peso;
    if (rand <= soma) return s.emoji;
  }
}

// ==========================
// 💰 CALCULAR GANHO
// ==========================
function calcularGanho(r1, r2, r3, aposta) {

  // JACKPOT
  if (r1 === '💀' && r2 === '💀' && r3 === '💀') {
    return aposta * 20;
  }

  // 3 IGUAIS
  if (r1 === r2 && r2 === r3) {
    return aposta * 5;
  }

  // 2 IGUAIS
  if (r1 === r2 || r2 === r3 || r1 === r3) {
    return aposta * 2;
  }

  return 0;
}

// ==========================
// 🎨 EMBED BONITO
// ==========================
function criarEmbed(resultado, aposta, ganho, saldo) {
  return new EmbedBuilder()
    .setTitle('🎰 SLOT INSANO — FROSTVOW')
    .setDescription(
      `╔══════════════╗\n` +
      ` ${resultado[0]} │ ${resultado[1]} │ ${resultado[2]}\n` +
      `╚══════════════╝\n\n` +
      `💰 **Aposta:** ${aposta}\n` +
      `🏆 **Ganho:** ${ganho}\n` +
      `💳 **Saldo:** ${saldo}`
    )
    .setColor('#111827')
    .setFooter({ text: 'Boa sorte na próxima rodada 🍀' });
}

// ==========================
// 🔁 BOTÕES
// ==========================
function criarBotoes(aposta) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`slot_repeat_${aposta}`)
        .setLabel('🔁 Jogar novamente')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`slot_double_${aposta}`)
        .setLabel('🔥 Dobrar aposta')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

// ==========================
// 🎰 SISTEMA PRINCIPAL
// ==========================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!slot')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const id = message.author.id;

    // 🔒 VALIDAÇÃO
    if (!aposta || aposta <= 0) {
      return message.reply('❌ Use: !slot <valor>');
    }

    const db = getDB();

    if (db.users[id] === undefined) {
      db.users[id] = 10000;
    }

    if (aposta > db.users[id]) {
      return message.reply(
        `💸 Seu saldo é **${db.users[id]}**.\nComo vai apostar isso? 🤨`
      );
    }

    // 💰 DESCONTO
    db.users[id] -= aposta;

    // 🎲 RESULTADO
    const r1 = pegarSimbolo();
    const r2 = pegarSimbolo();
    const r3 = pegarSimbolo();

    const resultado = [r1, r2, r3];

    const ganho = calcularGanho(r1, r2, r3, aposta);

    // 💵 ADICIONA GANHO
    db.users[id] += ganho;

    saveDB(db);

    const embed = criarEmbed(resultado, aposta, ganho, db.users[id]);

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

      if (interaction.customId.startsWith('slot_double')) {
        novaAposta = aposta * 2;
      }

      const db = getDB();

      if (novaAposta > db.users[id]) {
        return interaction.followUp({
          content: `💸 Você só tem ${db.users[id]} moedas.`,
          ephemeral: true
        });
      }

      db.users[id] -= novaAposta;

      const r1 = pegarSimbolo();
      const r2 = pegarSimbolo();
      const r3 = pegarSimbolo();

      const ganho = calcularGanho(r1, r2, r3, novaAposta);

      db.users[id] += ganho;

      saveDB(db);

      const embed = criarEmbed([r1, r2, r3], novaAposta, ganho, db.users[id]);

      await msg.edit({
        embeds: [embed],
        components: criarBotoes(novaAposta)
      });
    });

  });

};
