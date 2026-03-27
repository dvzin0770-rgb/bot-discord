const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {

  const CANAL_QUIZ = '💬丨ɢᴇʀᴀʟ';
  const CARGO_PERMITIDO = '⃤⃟⃝Membros da crew';
  const PERGUNTAS_PATH = './perguntas.json';
  const DB_PATH = './quiz.json';

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }

  function getDB() {
    return JSON.parse(fs.readFileSync(DB_PATH));
  }

  function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  function getPergunta() {
    const perguntas = JSON.parse(fs.readFileSync(PERGUNTAS_PATH));
    return perguntas[Math.floor(Math.random() * perguntas.length)];
  }

  function getPontos(dificuldade) {
    if (dificuldade === 'facil') return 1;
    if (dificuldade === 'medio') return 2;
    if (dificuldade === 'dificil') return 3;
    return 1;
  }

  client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const canal = guild.channels.cache.find(c => c.name === CANAL_QUIZ);
    if (!canal) return console.log('Canal do quiz não encontrado');

    console.log('🧠 Sistema de quiz iniciado');

    setInterval(async () => {

      const pergunta = getPergunta();

      const embed = new EmbedBuilder()
        .setTitle('🧠 Quiz Blox Fruits')
        .setDescription(
          `**${pergunta.pergunta}**\n\n` +
          `A) ${pergunta.alternativas[0]}\n` +
          `B) ${pergunta.alternativas[1]}\n` +
          `C) ${pergunta.alternativas[2]}\n` +
          `D) ${pergunta.alternativas[3]}`
        )
        .setColor('#5865F2');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('A').setLabel('A').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('B').setLabel('B').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('C').setLabel('C').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('D').setLabel('D').setStyle(ButtonStyle.Primary)
      );

      const msg = await canal.send({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({ time: 600000 });

      let respondido = false;

      collector.on('collect', async (interaction) => {

        if (respondido) return interaction.reply({ content: '❌ Já responderam.', ephemeral: true });

        const member = interaction.member;
        const role = interaction.guild.roles.cache.find(r => r.name === CARGO_PERMITIDO);

        if (!role || !member.roles.cache.has(role.id)) {
          return interaction.reply({
            content: '❌ Só membros da tripulação podem participar.',
            ephemeral: true
          });
        }

        respondido = true;
        collector.stop();

        const respostaUsuario = interaction.customId;
        const respostaCorreta = ['A','B','C','D'][pergunta.resposta];

        const db = getDB();
        const id = interaction.user.id;

        let pontos = 0;

        if (respostaUsuario === respostaCorreta) {
          pontos = getPontos(pergunta.dificuldade);
          db[id] = (db[id] || 0) + pontos;
          saveDB(db);

          await interaction.reply({
            content: `✅ Você acertou! Ganhou ${pontos} ponto(s)`
          });
        } else {
          await interaction.reply({
            content: `❌ Você errou! Resposta correta: ${respostaCorreta}`
          });
        }

        // desativa botões
        const disabledRow = new ActionRowBuilder().addComponents(
          row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
        );

        await msg.edit({ components: [disabledRow] });

      });

    }, 900000); // 15 minutos

  });

};
