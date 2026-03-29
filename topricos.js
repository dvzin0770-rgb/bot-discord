const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.content.toLowerCase() !== '!topricos') return;

    let db = {};

    try {
      db = getDB();
    } catch (err) {
      return message.reply('❌ Erro ao ler economia.');
    }

    const ranking = Object.entries(db)
      .sort((a, b) => (b[1].dinheiro || 0) - (a[1].dinheiro || 0))
      .slice(0, 10);

    if (ranking.length === 0) {
      return message.reply('❌ Ninguém tem dinheiro ainda.');
    }

    let texto = '';

    for (let i = 0; i < ranking.length; i++) {
      const userId = ranking[i][0];
      const dinheiro = ranking[i][1].dinheiro || 0;

      const user = await client.users.fetch(userId).catch(() => null);
      const nome = user ? user.username : 'Desconhecido';

      const pos = i + 1;

      const medalha =
        pos === 1 ? '🥇' :
        pos === 2 ? '🥈' :
        pos === 3 ? '🥉' : `#${pos}`;

      texto += `${medalha} **${nome}** — 💰 ${dinheiro}\n`;
    }

    const posicaoUser = Object.entries(db)
      .sort((a, b) => (b[1].dinheiro || 0) - (a[1].dinheiro || 0))
      .findIndex(u => u[0] === message.author.id);

    let suaPos = 'Você não está no ranking.';
    if (posicaoUser !== -1) {
      const dinheiro = db[message.author.id].dinheiro || 0;
      suaPos = `#${posicaoUser + 1} com **${dinheiro} moedas**`;
    }

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('💰 RANKING DE RICOS — FROSTVOW')
      .setDescription(texto)
      .addFields({
        name: '📍 Sua posição',
        value: suaPos
      })
      .setFooter({ text: `Total de usuários: ${Object.keys(db).length}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  });

};
