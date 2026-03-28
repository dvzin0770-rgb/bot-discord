const fs = require('fs');
const path = require('path');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = path.join(__dirname, 'banco-eventos.json');

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.content.toLowerCase() !== '!rankeventos') return;

    let db = {};

    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        db = raw ? JSON.parse(raw) : {};
      }
    } catch (err) {
      return message.reply('❌ Erro ao ler o banco.');
    }

    const ranking = Object.entries(db)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50); // 🔥 LIMITA ATÉ TOP 50

    if (ranking.length === 0) {
      return message.reply('❌ Ninguém tem pontos ainda.');
    }

    let pagina = 0;
    const porPagina = 10;
    const totalPaginas = Math.ceil(ranking.length / porPagina);

    const gerarEmbed = async () => {
      const inicio = pagina * porPagina;
      const fim = inicio + porPagina;

      let texto = '';

      for (let i = inicio; i < fim && i < ranking.length; i++) {
        const userId = ranking[i][0];
        const pontos = ranking[i][1];

        const user = await client.users.fetch(userId).catch(() => null);
        const nome = user ? user.username : 'Desconhecido';

        const pos = i + 1;

        const medalha =
          pos === 1 ? '🥇' :
          pos === 2 ? '🥈' :
          pos === 3 ? '🥉' : `#${pos}`;

        texto += `${medalha} **${nome}** — ${pontos} pts\n`;
      }

      const posicaoUser = ranking.findIndex(u => u[0] === message.author.id);

      let suaPos = 'Você não está no Top 50.';
      if (posicaoUser !== -1) {
        suaPos = `#${posicaoUser + 1} com **${db[message.author.id]} pontos**`;
      }

      return new EmbedBuilder()
        .setColor('#00b0f4')
        .setTitle('🏆 RANKING DE EVENTOS — FROSTVOW')
        .setDescription(`Página **${pagina + 1}/${totalPaginas}**\n\n${texto}`)
        .addFields({
          name: '📍 Sua posição',
          value: suaPos
        })
        .setFooter({ text: `Total de participantes: ${ranking.length}` })
        .setTimestamp();
    };

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('rank_anterior')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('rank_proximo')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [await gerarEmbed()],
      components: [botoes]
    });

    const collector = msg.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ Só quem usou o comando pode trocar a página.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'rank_anterior') {
        if (pagina > 0) pagina--;
      }

      if (interaction.customId === 'rank_proximo') {
        if (pagina < totalPaginas - 1) pagina++;
      }

      await interaction.update({
        embeds: [await gerarEmbed()],
        components: [botoes]
      });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });

  });

};
