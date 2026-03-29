const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = './economia.json';

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

    // 🔥 cria usuário sem resetar
    if (db.users[id] === undefined) {
      db.users[id] = 10000;
      saveDB(db);
    }

    if (db.users[id] < aposta) {
      return message.reply(
        `💸 Seu saldo é **${db.users[id]} moedas**.\nComo vai apostar **${aposta}**? 🤨`
      );
    }

    db.users[id] -= aposta;
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
              .setLabel(jogo.revelados[index] ? jogo.grid[index] : '⬛')
              .setStyle(jogo.revelados[index] ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(jogo.revelados[index] || !jogo.ativo)
          );
        }

        rows.push(row);
      }

      const controle = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sacar')
          .setLabel('💰 Sacar')
          .setStyle(ButtonStyle.Success)
          .setDisabled(!jogo.ativo),
        new ButtonBuilder()
          .setCustomId('replay')
          .setLabel('🔁 Jogar novamente')
          .setStyle(ButtonStyle.Primary)
      );

      rows.push(controle);

      return rows;
    };

    const gerarEmbed = () => {
      return new EmbedBuilder()
        .setTitle('💣 MINES — FROSTVOW')
        .setDescription(
          `💰 **Aposta:** ${jogo.aposta}\n` +
          `💣 **Minas:** ${jogo.minas}\n` +
          `📈 **Multiplicador:** x${jogo.multiplicador.toFixed(2)}\n` +
          `💎 **Possível ganho:** ${Math.floor(jogo.aposta * jogo.multiplicador)}`
        )
        .setColor('#0f172a')
        .setFooter({ text: 'Clique com cuidado...' });
    };

    const msg = await message.channel.send({
      embeds: [gerarEmbed()],
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

      await interaction.deferUpdate();

      if (!jogo.ativo) return;

      if (interaction.customId === 'replay') {
        return message.channel.send(`Use novamente: !mines ${minas} ${aposta}`);
      }

      if (interaction.customId === 'sacar') {
        const ganho = Math.floor(jogo.aposta * jogo.multiplicador);

        const db = getDB();
        db.users[id] += ganho;
        saveDB(db);

        jogo.ativo = false;

        return msg.edit({
          content: `💰 Você sacou ${ganho} moedas!`,
          embeds: [],
          components: []
        });
      }

      const index = parseInt(interaction.customId.split('_')[1]);

      if (jogo.grid[index] === '💣') {
        jogo.ativo = false;
        jogo.revelados = jogo.grid.map(() => true);

        return msg.edit({
          content: '💣 BOOM! Você perdeu tudo!',
          embeds: [],
          components: gerarBotoes()
        });
      }

      jogo.revelados[index] = true;
      jogo.multiplicador += 0.5;

      await msg.edit({
        embeds: [gerarEmbed()],
        components: gerarBotoes()
      });
    });

  });

};
