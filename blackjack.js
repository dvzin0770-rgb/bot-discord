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

  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function comprarCarta() {
  const cartas = [2,3,4,5,6,7,8,9,10,10,10,10,11];
  return cartas[Math.floor(Math.random() * cartas.length)];
}

function calcularMao(mao) {
  let total = mao.reduce((a, b) => a + b, 0);

  while (total > 21 && mao.includes(11)) {
    mao[mao.indexOf(11)] = 1;
    total = mao.reduce((a, b) => a + b, 0);
  }

  return total;
}

module.exports = (client) => {

  async function iniciarJogo(message, aposta) {

    const db = getDB();
    const id = message.author.id;

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

    let player = [comprarCarta(), comprarCarta()];
    let dealer = [comprarCarta(), comprarCarta()];

    let ativo = true;

    const gerarEmbed = (final = false) => {
      const playerTotal = calcularMao([...player]);
      const dealerTotal = calcularMao([...dealer]);

      return new EmbedBuilder()
        .setTitle('🃏 BLACKJACK — FROSTVOW')
        .setDescription(
          `👤 **Você:** ${player.join(', ')} (**${playerTotal}**)\n` +
          `🤖 **Dealer:** ${final ? dealer.join(', ') : dealer[0] + ', ❓'} (${final ? dealerTotal : '?'})\n\n` +
          `💰 Aposta: ${aposta}`
        )
        .setColor('#111827')
        .setFooter({ text: final ? 'Resultado final' : 'Hit ou Stand?' });
    };

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('🃏 Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand').setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [gerarEmbed()],
      components: [botoes]
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== id) {
        return interaction.reply({ content: '❌ Não é seu jogo.', ephemeral: true });
      }

      await interaction.deferUpdate();

      if (!ativo) return;

      if (interaction.customId === 'hit') {
        player.push(comprarCarta());

        if (calcularMao([...player]) > 21) {
          ativo = false;

          return msg.edit({
            content: '💥 Você estourou! Perdeu!',
            embeds: [gerarEmbed(true)],
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('replay')
                .setLabel('🔁 Jogar novamente')
                .setStyle(ButtonStyle.Primary)
            )]
          });
        }

        return msg.edit({
          embeds: [gerarEmbed()],
          components: [botoes]
        });
      }

      if (interaction.customId === 'stand') {
        ativo = false;

        while (calcularMao([...dealer]) < 17) {
          dealer.push(comprarCarta());
        }

        const playerTotal = calcularMao([...player]);
        const dealerTotal = calcularMao([...dealer]);

        let resultado = '';

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          db.users[id] += aposta * 2;
          resultado = `🎉 Você ganhou ${aposta * 2}!`;
        } else if (playerTotal === dealerTotal) {
          db.users[id] += aposta;
          resultado = '🤝 Empate!';
        } else {
          resultado = '💀 Você perdeu!';
        }

        saveDB(db);

        return msg.edit({
          content: resultado,
          embeds: [gerarEmbed(true)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('replay')
              .setLabel('🔁 Jogar novamente')
              .setStyle(ButtonStyle.Primary)
          )]
        });
      }

      if (interaction.customId === 'replay') {
        return iniciarJogo(message, aposta);
      }

    });

  }

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!blackjack')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);

    if (!aposta) {
      return message.reply('❌ Use: !blackjack <aposta>');
    }

    iniciarJogo(message, aposta);
  });

};
