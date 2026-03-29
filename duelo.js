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
const duelos = new Map();
const cooldown = new Map();

// ==============================
// ⚙️ CONFIG
// ==============================
const TEMPO_CONVITE = 30000;
const TEMPO_TURNO = 30000;

// ==============================
// ❤️ GERAR PLAYER
// ==============================
function criarPlayer(id, nome, aposta) {
  return {
    id,
    nome,
    hp: 100,
    aposta,
    defesa: false
  };
}

// ==============================
// 🎲 DANO
// ==============================
function calcularDano() {
  let base = Math.floor(Math.random() * 20) + 10;
  let critico = Math.random() < 0.2;

  if (critico) base *= 2;

  return { dano: base, critico };
}

// ==============================
// 🎨 EMBED
// ==============================
function criarEmbed(p1, p2, turno, log) {

  return new EmbedBuilder()
    .setColor('#ef4444')
    .setTitle('⚔️ DUELO 2.0 — FROSTVOW')
    .setDescription(
      `🔥 **${p1.nome}** vs **${p2.nome}**\n\n` +
      `❤️ ${p1.nome}: **${p1.hp} HP**\n` +
      `❤️ ${p2.nome}: **${p2.hp} HP**\n\n` +
      `🎯 Turno: **${turno.nome}**\n\n` +
      `📜 Última ação:\n${log || 'Nenhuma'}`
    );
}

// ==============================
// 🔘 BOTÕES
// ==============================
function botoes(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`atk_${userId}`)
        .setLabel('⚔️ Atacar')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`def_${userId}`)
        .setLabel('🛡️ Defender')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

// ==============================
// 🎮 COMANDO
// ==============================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith('!duelo')) return;

    const args = message.content.split(' ');
    const alvo = message.mentions.users.first();
    const valor = Number(args[2]);
    const id = message.author.id;

    // ==============================
    // VALIDAÇÃO
    // ==============================
    if (!alvo) return message.reply('❌ Marque alguém.');
    if (!valor || valor <= 0) return message.reply('❌ Valor inválido.');
    if (alvo.id === id) return message.reply('❌ Não pode lutar contra si mesmo.');

    const saldo1 = eco.getSaldo(id);
    const saldo2 = eco.getSaldo(alvo.id);

    if (valor > saldo1) return message.reply(`💸 Seu saldo: ${saldo1}`);
    if (valor > saldo2) return message.reply(`💸 Saldo do oponente: ${saldo2}`);

    // ==============================
    // CONVITE
    // ==============================
    const convite = await message.channel.send({
      content: `⚔️ ${alvo}, você aceita o duelo de **${valor} moedas**?`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('aceitar')
            .setLabel('✅ Aceitar')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('recusar')
            .setLabel('❌ Recusar')
            .setStyle(ButtonStyle.Danger)
        )
      ]
    });

    const filtro = i => i.user.id === alvo.id;

    const collector = convite.createMessageComponentCollector({
      filter: filtro,
      time: TEMPO_CONVITE
    });

    collector.on('collect', async (i) => {

      if (i.customId === 'recusar') {
        collector.stop();
        return convite.edit({ content: '❌ Duelo recusado.', components: [] });
      }

      if (i.customId === 'aceitar') {

        collector.stop();

        // ==============================
        // INICIAR
        // ==============================
        eco.removeMoney(id, valor);
        eco.removeMoney(alvo.id, valor);

        const p1 = criarPlayer(id, message.author.username, valor);
        const p2 = criarPlayer(alvo.id, alvo.username, valor);

        let turno = p1;
        let outro = p2;

        let log = 'Duelo iniciado!';

        const jogo = { p1, p2, turno, outro };

        duelos.set(message.channel.id, jogo);

        const msg = await convite.edit({
          content: '',
          embeds: [criarEmbed(p1, p2, turno, log)],
          components: botoes(turno.id)
        });

        const fight = msg.createMessageComponentCollector({ time: 300000 });

        // ==============================
        // TURNO
        // ==============================
        fight.on('collect', async (btn) => {

          if (btn.user.id !== turno.id) {
            return btn.reply({ content: '❌ Não é seu turno.', ephemeral: true });
          }

          await btn.deferUpdate();

          if (btn.customId.startsWith('atk')) {

            const { dano, critico } = calcularDano();

            let final = dano;

            if (outro.defesa) {
              final = Math.floor(dano / 2);
              outro.defesa = false;
            }

            outro.hp -= final;

            log =
              `⚔️ ${turno.nome} causou **${final} dano**` +
              (critico ? ' 💥 CRÍTICO!' : '');

          }

          if (btn.customId.startsWith('def')) {
            turno.defesa = true;
            log = `🛡️ ${turno.nome} está defendendo!`;
          }

          // ==============================
          // VITÓRIA
          // ==============================
          if (outro.hp <= 0) {

            const premio = valor * 2;

            eco.addMoney(turno.id, premio);

            fight.stop();

            return msg.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('#22c55e')
                  .setTitle('🏆 DUELO FINALIZADO')
                  .setDescription(
                    `👑 ${turno.nome} venceu!\n\n💰 Ganhou ${premio} moedas`
                  )
              ],
              components: []
            });
          }

          // ==============================
          // TROCAR TURNO
          // ==============================
          [turno, outro] = [outro, turno];

          await msg.edit({
            embeds: [criarEmbed(p1, p2, turno, log)],
            components: botoes(turno.id)
          });

        });

        // ==============================
        // TIMEOUT
        // ==============================
        fight.on('end', () => {
          duelos.delete(message.channel.id);
        });

      }

    });

    collector.on('end', (c, r) => {
      if (r === 'time') {
        convite.edit({ content: '⏰ Tempo esgotado.', components: [] });
      }
    });

  });

};
