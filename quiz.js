const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {

  const CANAL_QUIZ = '💬丨ɢᴇʀᴀʟ';
  const CARGO_PERMITIDO = '⃤⃟⃝Membros da crew';
  const PERGUNTAS_PATH = './perguntas.json';
  const DB_PATH = './quiz.json';

  const IMAGEM_QUIZ = 'https://files.catbox.moe/7r2m0q.png';

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

  async function enviarPergunta(canal) {
    const pergunta = getPergunta();
    const pontos = getPontos(pergunta.dificuldade);

    const embed = new EmbedBuilder()
      .setTitle('🧠 Hora do Quiz')
      .setDescription(`**${pergunta.pergunta}**`)
      .addFields(
        {
          name: '⚔️ Dificuldade',
          value: pergunta.dificuldade.charAt(0).toUpperCase() + pergunta.dificuldade.slice(1),
          inline: true
        },
        {
          name: '🏷️ Tema',
          value: pergunta.tag || 'Blox Fruits',
          inline: true
        },
        {
          name: '🏆 Recompensa',
          value: `${'⭐'.repeat(pontos)} ${pontos} ponto(s)`,
          inline: false
        }
      )
      .setImage(IMAGEM_QUIZ)
      .setColor('#5865F2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('0').setLabel(pergunta.alternativas[0]).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('1').setLabel(pergunta.alternativas[1]).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('2').setLabel(pergunta.alternativas[2]).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('3').setLabel(pergunta.alternativas[3]).setStyle(ButtonStyle.Primary)
    );

    const msg = await canal.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 1800000 });

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

      const respostaUsuario = parseInt(interaction.customId);
      const respostaCorreta = pergunta.resposta;

      const db = getDB();
      const id = interaction.user.id;

      if (respostaUsuario === respostaCorreta) {
        const pontos = getPontos(pergunta.dificuldade);
        db[id] = (db[id] || 0) + pontos;
        saveDB(db);

        await interaction.reply(`✅ Você acertou! Ganhou ${pontos} ponto(s) ⭐`);
      } else {
        await interaction.reply(`❌ Você errou! Tente na próxima 😭`);
      }

      await msg.edit({ components: [] });
    });
  }

  // 🔥 AGORA 30 MINUTOS
  function agendar(canal) {
    const agora = new Date();
    const minutos = agora.getMinutes();
    const segundos = agora.getSeconds();

    const proximo = 30 - (minutos % 30);
    const delay = (proximo * 60 - segundos) * 1000;

    setTimeout(() => {
      enviarPergunta(canal);
      setInterval(() => enviarPergunta(canal), 30 * 60 * 1000);
    }, delay);
  }

  client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const canal = guild.channels.cache.find(c => c.name === CANAL_QUIZ);
    if (!canal) return console.log('Canal do quiz não encontrado');

    console.log('🧠 Quiz FULL personalizado ativado (30min)');
    agendar(canal);
  });

};
