const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const eco = require('./economia');

// ==============================
// 🧠 SISTEMA GLOBAL
// ==============================
const jogos = new Map();

// ==============================
// 🃏 CARTAS
// ==============================
const cartas = [
  'A','2','3','4','5','6','7','8','9','10','J','Q','K'
];

// ==============================
// 🎲 PEGAR CARTA
// ==============================
function puxarCarta() {
  return cartas[Math.floor(Math.random() * cartas.length)];
}

// ==============================
// 🧮 VALOR CARTA
// ==============================
function valorCarta(carta) {
  if (['J','Q','K'].includes(carta)) return 10;
  if (carta === 'A') return 11;
  return Number(carta);
}

// ==============================
// 🧠 CALCULAR MÃO
// ==============================
function calcularMao(mao) {

  let total = 0;
  let ases = 0;

  for (let c of mao) {
    total += valorCarta(c);
    if (c === 'A') ases++;
  }

  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }

  return total;
}

// ==============================
// 🎨 EMBED
// ==============================
function criarEmbed(user, jogo, esconderDealer = true, resultado = null) {

  const playerTotal = calcularMao(jogo.player);
  const dealerTotal = calcularMao(jogo.dealer);

  const dealerCartas = esconderDealer
    ? `${jogo.dealer[0]} ❓`
    : jogo.dealer.join(' ');

  return new EmbedBuilder()
    .setColor('#0ea5e9')
    .setTitle('🃏 BLACKJACK ULTRA — FROSTVOW')
    .setDescription(
      `👤 ${user}\n\n` +
      `🎴 **Dealer:** ${dealerCartas}\n` +
      `💠 Total: ${esconderDealer ? '?' : dealerTotal}\n\n` +
      `🧍 **Você:** ${jogo.player.join(' ')}\n` +
      `💠 Total: ${playerTotal}\n\n` +
      `💸 Aposta: ${jogo.aposta}\n\n` +
      `${resultado ? `🏆 ${resultado}` : 'Escolha uma ação...'}`
    );
}

// ==============================
// 🔘 BOTÕES
// ==============================
function botoes(ativo = true) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('hit')
        .setLabel('🃏 Comprar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!ativo),

      new ButtonBuilder()
        .setCustomId('stand')
        .setLabel('✋ Parar')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!ativo)
    )
  ];
}

// ==============================
// 🎮 COMANDO
// ==============================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith('!blackjack')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const id = message.author.id;

    // ==============================
    // VALIDAÇÃO
    // ==============================
    if (!aposta || aposta <= 0) {
      return message.reply('❌ Aposta inválida.');
    }

    const saldo = eco.getSaldo(id);

    if (aposta > saldo) {
      return message.reply(`💸 Seu saldo: ${saldo}`);
    }

    // ==============================
    // INICIAR
    // ==============================
    eco.removeMoney(id, aposta);

    const jogo = {
      player: [puxarCarta(), puxarCarta()],
      dealer: [puxarCarta(), puxarCarta()],
      aposta,
      ativo: true
    };

    jogos.set(id, jogo);

    const msg = await message.channel.send({
      embeds: [criarEmbed(message.author.username, jogo)],
      components: botoes(true)
    });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    // ==============================
    // INTERAÇÃO
    // ==============================
    collector.on('collect', async (i) => {

      if (i.user.id !== id) {
        return i.reply({ content: '❌ Não é seu jogo.', ephemeral: true });
      }

      await i.deferUpdate();

      const jogo = jogos.get(id);
      if (!jogo || !jogo.ativo) return;

      // ==============================
      // HIT
      // ==============================
      if (i.customId === 'hit') {

        jogo.player.push(puxarCarta());

        const total = calcularMao(jogo.player);

        if (total > 21) {

          jogo.ativo = false;

          collector.stop();

          return msg.edit({
            embeds: [
              criarEmbed(
                message.author.username,
                jogo,
                false,
                '💀 Você estourou!'
              )
            ],
            components: []
          });
        }

        return msg.edit({
          embeds: [criarEmbed(message.author.username, jogo)],
          components: botoes(true)
        });
      }

      // ==============================
      // STAND
      // ==============================
      if (i.customId === 'stand') {

        jogo.ativo = false;

        // dealer joga
        while (calcularMao(jogo.dealer) < 17) {
          jogo.dealer.push(puxarCarta());
        }

        const playerTotal = calcularMao(jogo.player);
        const dealerTotal = calcularMao(jogo.dealer);

        let resultado = '';
        let ganho = 0;

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          resultado = '🏆 Você venceu!';
          ganho = aposta * 2;
        }
        else if (playerTotal === dealerTotal) {
          resultado = '🤝 Empate!';
          ganho = aposta;
        }
        else {
          resultado = '💀 Você perdeu!';
        }

        if (ganho > 0) {
          eco.addMoney(id, ganho);
        }

        collector.stop();

        return msg.edit({
          embeds: [
            criarEmbed(
              message.author.username,
              jogo,
              false,
              resultado + `\n💰 Ganho: ${ganho}`
            )
          ],
          components: []
        });
      }

    });

    // ==============================
    // FIM
    // ==============================
    collector.on('end', () => {
      jogos.delete(id);
    });

  });

};
