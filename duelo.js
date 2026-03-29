const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DB_PATH = './economia.json';

// ==========================
// 📁 BANCO
// ==========================
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

// ==========================
// ⚔️ SISTEMA
// ==========================
module.exports = (client) => {

  const duelos = new Map();

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!duelo')) return;

    const args = message.content.split(' ');
    const alvo = message.mentions.users.first();
    const aposta = Number(args[2]);
    const p1 = message.author;

    if (!alvo) return message.reply('❌ Marque alguém.');
    if (alvo.id === p1.id) return message.reply('❌ Não pode você mesmo.');
    if (!aposta || aposta <= 0) return message.reply('❌ Valor inválido.');

    const db = getDB();

    if (db.users[p1.id] === undefined) db.users[p1.id] = 10000;
    if (db.users[alvo.id] === undefined) db.users[alvo.id] = 10000;

    if (db.users[p1.id] < aposta)
      return message.reply(`💸 Você tem ${db.users[p1.id]}`);

    if (db.users[alvo.id] < aposta)
      return message.reply(`💸 ${alvo.username} não tem saldo`);

    const embed = new EmbedBuilder()
      .setTitle('⚔️ DUELO 2.0')
      .setDescription(`${p1} desafiou ${alvo}\n💰 ${aposta} moedas`)
      .setColor('#ef4444');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aceitar')
        .setLabel('Aceitar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('recusar')
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (i) => {

      if (i.user.id !== alvo.id)
        return i.reply({ content: '❌ Não é você.', ephemeral: true });

      await i.deferUpdate();

      if (i.customId === 'recusar') {
        return msg.edit({ content: '❌ Recusado.', embeds: [], components: [] });
      }

      // ================= INICIO
      db.users[p1.id] -= aposta;
      db.users[alvo.id] -= aposta;
      saveDB(db);

      let jogo = {
        turno: p1.id,
        p1: { id: p1.id, vida: 100, energia: 3 },
        p2: { id: alvo.id, vida: 100, energia: 3 },
        aposta,
        ativo: true
      };

      duelos.set(msg.id, jogo);

      function embedDuelo() {
        return new EmbedBuilder()
          .setTitle('⚔️ DUELO 2.0')
          .setDescription(
            `👤 <@${jogo.p1.id}> ❤️ ${jogo.p1.vida} ⚡ ${jogo.p1.energia}\n` +
            `👤 <@${jogo.p2.id}> ❤️ ${jogo.p2.vida} ⚡ ${jogo.p2.energia}\n\n` +
            `🎯 Turno: <@${jogo.turno}>`
          )
          .setColor('#0f172a');
      }

      function botoes(userId, ativo = true) {
        return [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('atk')
              .setLabel('⚔️ Atacar')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(!ativo),

            new ButtonBuilder()
              .setCustomId('def')
              .setLabel('🛡️ Defender')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(!ativo),

            new ButtonBuilder()
              .setCustomId('spc')
              .setLabel('💥 Especial')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!ativo)
          )
        ];
      }

      await msg.edit({
        embeds: [embedDuelo()],
        components: botoes(jogo.turno)
      });

      const fight = msg.createMessageComponentCollector({ time: 180000 });

      fight.on('collect', async (i) => {

        const jogo = duelos.get(msg.id);
        if (!jogo || !jogo.ativo) return;

        if (i.user.id !== jogo.turno) {
          return i.reply({ content: '❌ Não é seu turno.', ephemeral: true });
        }

        await i.deferUpdate();

        const atacante = jogo.turno === jogo.p1.id ? jogo.p1 : jogo.p2;
        const defensor = jogo.turno === jogo.p1.id ? jogo.p2 : jogo.p1;

        let dano = 0;

        // ================= ATAQUE
        if (i.customId === 'atk') {
          dano = Math.floor(Math.random() * 15) + 5;
        }

        // ================= DEFESA
        if (i.customId === 'def') {
          atacante.energia++;
        }

        // ================= ESPECIAL
        if (i.customId === 'spc') {
          if (atacante.energia < 2) {
            return i.followUp({
              content: '⚡ Energia insuficiente',
              ephemeral: true
            });
          }

          atacante.energia -= 2;
          dano = Math.floor(Math.random() * 25) + 10;

          if (Math.random() < 0.3) {
            dano *= 2; // crítico
          }
        }

        defensor.vida -= dano;

        // troca turno
        jogo.turno = defensor.id;

        // fim
        if (defensor.vida <= 0) {
          jogo.ativo = false;

          const vencedor = atacante.id;
          const premio = jogo.aposta * 2;

          const db = getDB();
          db.users[vencedor] += premio;
          saveDB(db);

          return msg.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle('🏆 VITÓRIA')
                .setDescription(`<@${vencedor}> ganhou ${premio}`)
                .setColor('#22c55e')
            ],
            components: []
          });
        }

        await msg.edit({
          embeds: [embedDuelo()],
          components: botoes(jogo.turno)
        });
      });

    });

  });

};
