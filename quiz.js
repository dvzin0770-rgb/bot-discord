const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = (client) => {

  const PERGUNTAS_PATH = './perguntas.json';

  // =========================
  // 🔥 CONTROLE GLOBAL
  // =========================
  let quizAtivo = false;
  let cooldown = new Map(); // anti spam

  // =========================
  // 📖 CARREGAR PERGUNTA
  // =========================
  function getPergunta() {
    try {
      const data = JSON.parse(fs.readFileSync(PERGUNTAS_PATH));

      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      return data[Math.floor(Math.random() * data.length)];

    } catch (err) {
      console.log('❌ ERRO PERGUNTAS:', err);
      return null;
    }
  }

  // =========================
  // 🏆 PONTOS
  // =========================
  function getPontos(dif) {
    if (dif === 'facil') return 1;
    if (dif === 'medio') return 2;
    if (dif === 'dificil') return 3;
    return 1;
  }

  // =========================
  // 🔘 BOTÕES CORRETOS
  // =========================
  function criarBotoes(pergunta) {

    const row = new ActionRowBuilder();

    for (let i = 0; i < pergunta.alternativas.length; i++) {

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_${Date.now()}_${i}`)
          .setLabel(pergunta.alternativas[i])
          .setStyle(ButtonStyle.Primary)
      );

    }

    return [row];
  }

  // =========================
  // 🚀 EXECUTAR QUIZ
  // =========================
  async function executarQuiz(message) {

    if (quizAtivo) {
      return message.reply('❌ Já existe um quiz acontecendo.');
    }

    const pergunta = getPergunta();

    if (!pergunta) {
      return message.reply('❌ Erro ao carregar perguntas.');
    }

    quizAtivo = true;

    const pontos = getPontos(pergunta.dificuldade);

    const embed = new EmbedBuilder()
      .setTitle('🧠 QUIZ INSANO — FROSTVOW')
      .setDescription(
        `**${pergunta.pergunta}**\n\n` +
        `💬 Responda antes do tempo acabar!`
      )
      .addFields(
        {
          name: '⚔️ Dificuldade',
          value: pergunta.dificuldade.toUpperCase(),
          inline: true
        },
        {
          name: '🏆 Pontos',
          value: `${pontos}`,
          inline: true
        }
      )
      .setFooter({ text: '⏱️ Tempo: 30 segundos' })
      .setColor('#5865F2');

    const msg = await message.channel.send({
      embeds: [embed],
      components: criarBotoes(pergunta)
    });

    let respondido = false;

    const collector = msg.createMessageComponentCollector({
      time: 30000
    });

    // =========================
    // 🎯 RESPOSTA
    // =========================
    collector.on('collect', async (interaction) => {

      if (respondido) {
        return interaction.reply({
          content: '❌ Já responderam!',
          ephemeral: true
        });
      }

      respondido = true;

      const escolha = parseInt(interaction.customId.split('_')[2]);

      if (escolha === pergunta.resposta) {

        await interaction.reply(
          `✅ **Correto!**\n🏆 +${pontos} pontos`
        );

      } else {

        await interaction.reply(
          `❌ **Errado!**\nResposta: **${pergunta.alternativas[pergunta.resposta]}**`
        );

      }

      collector.stop();
    });

    // =========================
    // ⏰ FINALIZAÇÃO
    // =========================
    collector.on('end', async () => {

      if (!respondido) {
        await msg.reply('⏰ Tempo esgotado!');
      }

      await msg.edit({
        components: []
      });

      quizAtivo = false;
    });

  }

  // =========================
  // 🎮 COMANDO
  // =========================
  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (!message.content.startsWith('!quiz')) return;

    const id = message.author.id;
    const agora = Date.now();

    // 🔥 COOLDOWN 15s
    if (cooldown.has(id)) {
      const tempo = cooldown.get(id);

      if (agora - tempo < 15000) {
        return message.reply('⏳ Espere um pouco para usar novamente.');
      }
    }

    cooldown.set(id, agora);

    executarQuiz(message);

  });

};
