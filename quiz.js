const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = (client) => {

  const CANAL = '💬丨ɢᴇʀᴀʟ';
  const PERGUNTAS_PATH = './perguntas.json';
  const DB_PATH = './quiz-db.json';

  // 🔥 CONTROLE GLOBAL
  let quizRodando = false;
  let intervalo = null;

  // =========================
  // 📁 BANCO DE DADOS
  // =========================
  function getDB() {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
    }

    const data = JSON.parse(fs.readFileSync(DB_PATH));

    if (!data.users) data.users = {};

    return data;
  }

  function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // =========================
  // ❓ PERGUNTAS
  // =========================
  function getPergunta() {
    const data = JSON.parse(fs.readFileSync(PERGUNTAS_PATH));
    return data[Math.floor(Math.random() * data.length)];
  }

  function getPontos(dif) {
    if (dif === 'facil') return 1;
    if (dif === 'medio') return 2;
    if (dif === 'dificil') return 3;
    return 1;
  }

  // =========================
  // 🎨 EMBED INSANO
  // =========================
  function criarEmbed(p) {
    return new EmbedBuilder()
      .setTitle('🧠 QUIZ INSANO — FROSTVOW')
      .setDescription(`**${p.pergunta}**\n\n💬 Responda antes do tempo acabar!`)
      .addFields(
        {
          name: '⚔️ Dificuldade',
          value: p.dificuldade.toUpperCase(),
          inline: true
        },
        {
          name: '🏆 Pontos',
          value: `${getPontos(p.dificuldade)}`,
          inline: true
        }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Sistema automático • 30 minutos' });
  }

  // =========================
  // 🔘 BOTÕES
  // =========================
  function criarBotoes(p) {
    const row = new ActionRowBuilder();

    p.alternativas.forEach((alt, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_${i}`)
          .setLabel(alt)
          .setStyle(ButtonStyle.Primary)
      );
    });

    return row;
  }

  // =========================
  // 🚀 ENVIAR PERGUNTA
  // =========================
  async function enviarPergunta(canal) {
    const pergunta = getPergunta();
    const pontos = getPontos(pergunta.dificuldade);

    const msg = await canal.send({
      embeds: [criarEmbed(pergunta)],
      components: [criarBotoes(pergunta)]
    });

    const collector = msg.createMessageComponentCollector({
      time: 30000
    });

    let respondido = false;

    collector.on('collect', async (interaction) => {

      if (respondido) {
        return interaction.reply({
          content: '❌ Já responderam essa!',
          ephemeral: true
        });
      }

      respondido = true;
      collector.stop();

      const resposta = parseInt(interaction.customId.split('_')[1]);

      const db = getDB();
      const id = interaction.user.id;

      if (resposta === pergunta.resposta) {

        if (!db.users[id]) db.users[id] = 0;

        db.users[id] += pontos;
        saveDB(db);

        await interaction.reply(
          `✅ Acertou! +${pontos} ponto(s)`
        );

      } else {
        await interaction.reply(
          `❌ Errou! Resposta correta: **${pergunta.alternativas[pergunta.resposta]}**`
        );
      }

      await msg.edit({ components: [] });
    });

    collector.on('end', async () => {
      if (!respondido) {
        await msg.reply('⏰ Tempo esgotado!');
        await msg.edit({ components: [] });
      }
    });
  }

  // =========================
  // ⏱️ SISTEMA DE 30 MIN
  // =========================
  function iniciarQuiz(canal) {

    if (quizRodando) {
      console.log('⚠️ Quiz já está rodando');
      return;
    }

    quizRodando = true;

    console.log('✅ Quiz iniciado corretamente (30min fixo)');

    // 🔥 NÃO ENVIA IMEDIATO
    intervalo = setInterval(() => {
      enviarPergunta(canal);
    }, 30 * 60 * 1000);
  }

  // =========================
  // 🟢 READY
  // =========================
  client.once('ready', () => {

    const guild = client.guilds.cache.first();
    if (!guild) return;

    const canal = guild.channels.cache.find(c => c.name === CANAL);
    if (!canal) return console.log('❌ Canal não encontrado');

    iniciarQuiz(canal);
  });

};
