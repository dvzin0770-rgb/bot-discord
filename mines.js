const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = './economia.json';

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function gerarGrid(minas) {
  const grid = Array(16).fill('💎');

  let colocadas = 0;
  while (colocadas < minas) {
    const i = Math.floor(Math.random() * 16);
    if (grid[i] !== '💣') {
      grid[i] = '💣';
      colocadas++;
    }
  }

  return grid;
}

module.exports = (client) => {

  const jogos = new Map();

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!mines')) return;

    const args = message.content.split(' ');
    const minas = parseInt(args[1]);
    const aposta = parseInt(args[2]);

    if (!minas || !aposta) {
      return message.reply('❌ Use: !mines <minas> <aposta>');
    }

    if (minas < 1 || minas > 5) {
      return message.reply('❌ Minas entre 1 e 5.');
    }

    const db = getDB();
    const id = message.author.id;

    if (!db[id]) db[id] = { dinheiro: 10000, lastDaily: 0 };

    if (db[id].dinheiro < aposta) {
      return message.reply('❌ Você não tem saldo suficiente.');
    }

    db[id].dinheiro -= aposta;
    saveDB(db);

    const grid = gerarGrid(minas);

    const jogo = {
      grid,
      revelados: Array(16).fill(false),
      minas,
      aposta,
      multiplicador: 1,
      ativo: true
    };

    jogos.set(id, jogo);

    const gerarBotoes = (revelarTudo = false) => {
      const rows = [];

      for (let i = 0; i < 4; i++) {
        const row = new ActionRowBuilder();

        for (let j = 0; j < 4; j++) {
          const index = i * 4 + j;

          const revelado = jogo.revelados[index] || revelarTudo;
          const valor = jogo.grid[index];

          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mine_${index}`)
              .setLabel(revelado ? valor : '⬜')
              .setStyle(
                !revelado
                  ? ButtonStyle.Secondary
                  : valor === '💣'
                  ? ButtonStyle.Danger
                  : ButtonStyle.Success
              )
              .setDisabled(revelado)
          );
        }

        rows.push(row);
      }

      const controle = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sacar')
          .setLabel('💰 Sacar')
          .setStyle(ButtonStyle.Success)
      );

      rows.push(controle);

      return rows;
    };

    const saldoAtual = db[id].dinheiro;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTitle('💣・Mines — Frostvow')
      .setDescription('Clique nos blocos e evite as bombas... boa sorte 👀')
      .addFields(
        { name: '💰 Aposta', value: `**${aposta} moedas**`, inline: true },
        { name: '💣 Minas', value: `**${minas}**`, inline: true },
        { name: '📈 Multiplicador', value: `**1.00x**`, inline: true },
        { name: '🏦 Seu saldo', value: `**${saldoAtual} moedas**` }
      )
      .setFooter({ text: 'Frostvow • Sistema de Apostas' })
      .setTimestamp();

    const msg = await message.channel.send({
      embeds: [embed],
      components: gerarBotoes()
    });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== id) {
        return interaction.reply({
          content: '❌ Esse jogo não é seu.',
          ephemeral: true
        });
      }

      if (!jogo.ativo) return;

      if (interaction.customId === 'sacar') {
        const ganho = Math.floor(jogo.aposta * jogo.multiplicador);

        const db = getDB();
        db[id].dinheiro += ganho;
        saveDB(db);

        jogo.ativo = false;

        return interaction.update({
          content: `💰 Você sacou ${ganho}!`,
          embeds: [],
          components: []
        });
      }

      const index = parseInt(interaction.customId.split('_')[1]);

      if (jogo.grid[index] === '💣') {
        jogo.ativo = false;

        return interaction.update({
          content: '💥 **BOOM! Você explodiu!**',
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('💣・Mines — Game Over')
              .setDescription('Você acertou uma bomba... melhor sorte na próxima 😭')
              .addFields({
                name: '💸 Perda',
                value: `**-${aposta} moedas**`,
                inline: true
              })
              .setFooter({ text: 'Frostvow Casino' })
              .setTimestamp()
          ],
          components: gerarBotoes(true)
        });
      }

      jogo.revelados[index] = true;
      jogo.multiplicador += 0.5;

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('💣・Mines — Frostvow')
            .setDescription('Você está avançando... não explode agora 😈')
            .addFields(
              { name: '💰 Aposta', value: `**${aposta} moedas**`, inline: true },
              { name: '📈 Multiplicador', value: `**${jogo.multiplicador.toFixed(2)}x**`, inline: true },
              { name: '💎 Ganho atual', value: `**${Math.floor(aposta * jogo.multiplicador)} moedas**`, inline: true }
            )
            .setFooter({ text: 'Clique com cuidado...' })
            .setTimestamp()
        ],
        components: gerarBotoes()
      });
    });
  });
};
