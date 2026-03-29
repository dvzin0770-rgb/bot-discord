const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const PERGUNTAS_PATH = './perguntas.json';
const DB_PATH = './quiz.json';

const CANAL_QUIZ = '💬丨ɢᴇʀᴀʟ';
const CARGO_PERMITIDO = '⃤⃟⃝Membros da crew';

// ==========================
// 📁 BANCO
// ==========================
function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      totalRespostas: 0
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
// 📚 PERGUNTAS
// ==========================
function getPergunta() {
  const perguntas = JSON.parse(fs.readFileSync(PERGUNTAS_PATH));
  return perguntas[Math.floor(Math.random() * perguntas.length)];
}

// ==========================
// 🎯 PONTOS
// ==========================
function getPontos(diff) {
  if (diff === 'facil') return 1;
  if (diff === 'medio') return 2;
  if (diff === 'dificil') return 3;
  return 1;
}

// ==========================
// 🎨 EMBED
// ==========================
function criarEmbed(pergunta) {
  const pontos = getPontos(pergunta.dificuldade);

  return new EmbedBuilder()
    .setTitle('🧠 QUIZ INSANO — FROSTVOW')
    .setDescription(`**${pergunta.pergunta}**`)
    .addFields(
      {
        name: '⚔️ Dificuldade',
        value: pergunta.dificuldade,
        inline: true
      },
      {
        name: '🏆 Pontos',
        value: `${pontos}`,
        inline: true
      }
    )
    .setColor('#5865F2')
    .setFooter({ text: 'Responda rápido!' });
}

// ==========================
// 🔘 BOTÕES
// ==========================
function criarBotoes(pergunta, ativo = true) {
  const row = new ActionRowBuilder();

  pergunta.alternativas.forEach((alt, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_${i}`)
        .setLabel(alt)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!ativo)
    );
  });

  return [row];
}

// ==========================
// 🧠 SISTEMA
// ==========================
module.exports = (client) => {

  let perguntaAtual = null;
  let respondido = false;

  async function enviarPergunta(canal) {
    perguntaAtual = getPergunta();
    respondido = false;

    const embed = criarEmbed(perguntaAtual);

    const msg = await canal.send({
      embeds: [embed],
      components: criarBotoes(perguntaAtual, true)
    });

    const collector = msg.createMessageComponentCollector({
      time: 30000
    });

    collector.on('collect', async (interaction) => {

      // 🔒 evita erro de interação
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

      if (respondido) {
        return interaction.editReply('❌ Já responderam.');
      }

      const member = interaction.member;
      const role = interaction.guild.roles.cache.find(r => r.name === CARGO_PERMITIDO);

      if (!role || !member.roles.cache.has(role.id)) {
        return interaction.editReply('❌ Você não pode participar.');
      }

      respondido = true;
      collector.stop();

      const escolha = parseInt(interaction.customId.split('_')[1]);
      const correta = perguntaAtual.resposta;

      const db = getDB();
      const id = interaction.user.id;

      if (!db.users[id]) db.users[id] = 0;

      if (escolha === correta) {
        const pontos = getPontos(perguntaAtual.dificuldade);

        db.users[id] += pontos;
        db.totalRespostas++;

        saveDB(db);

        await interaction.editReply(`✅ Acertou! +${pontos} pontos`);
      } else {
        await interaction.editReply('❌ Errou!');
      }

      // 🔓 revelar resposta
      await msg.edit({
        embeds: [
          criarEmbed(perguntaAtual).setDescription(
            `**${perguntaAtual.pergunta}**\n\n✅ Resposta: ${perguntaAtual.alternativas[correta]}`
          )
        ],
        components: criarBotoes(perguntaAtual, false)
      });
    });

    collector.on('end', async () => {
      if (!respondido) {
        await msg.edit({
          content: '⏰ Tempo esgotado!',
          components: []
        });
      }
    });
  }

  // ==========================
  // ⏱️ AGENDAMENTO
  // ==========================
  function iniciarQuiz(canal) {
    enviarPergunta(canal);

    setInterval(() => {
      enviarPergunta(canal);
    }, 60000); // 1 min
  }

  client.once('ready', () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const canal = guild.channels.cache.find(c => c.name === CANAL_QUIZ);

    if (!canal) {
      console.log('❌ Canal do quiz não encontrado');
      return;
    }

    console.log('🧠 Quiz INSANO ativado');
    iniciarQuiz(canal);
  });

};
