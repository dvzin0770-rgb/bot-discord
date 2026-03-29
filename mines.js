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

    // 🔥 NOVO FORMATO
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

    const gerarBotoes = () => {
      const rows = [];

      for (let i = 0; i < 4; i++) {
        const row = new ActionRowBuilder();

        for (let j = 0; j < 4; j++) {
          const index = i * 4 + j;

          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mine_${index}`)
              .setLabel(jogo.revelados[index] ? jogo.grid[index] : '⬜')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(jogo.revelados[index])
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

    const embed = new EmbedBuilder()
      .setTitle('💣 Mines')
      .setDescription(`💰 Aposta: ${aposta}\n💣 Minas: ${minas}`)
      .setColor('#2b2d31');

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
          content: '💣 Você explodiu!',
          embeds: [],
          components: []
        });
      }

      jogo.revelados[index] = true;
      jogo.multiplicador += 0.5;

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle('💣 Mines')
            .setDescription(`💰 Aposta: ${aposta}\n📈 Multiplicador: ${jogo.multiplicador.toFixed(2)}x`)
            .setColor('#2b2d31')
        ],
        components: gerarBotoes()
      });
    });
  });
};
