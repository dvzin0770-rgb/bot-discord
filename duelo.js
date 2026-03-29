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
// ⚔️ SISTEMA DE DUELOS
// ==========================
module.exports = (client) => {

  const duelosAtivos = new Map();
  const cooldown = new Map();

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!duelo')) return;

    const args = message.content.split(' ');
    const alvo = message.mentions.users.first();
    const aposta = Number(args[2]);
    const autor = message.author;

    if (!alvo) {
      return message.reply('❌ Marque alguém para duelar.');
    }

    if (alvo.id === autor.id) {
      return message.reply('❌ Você não pode duelar com você mesmo.');
    }

    if (!aposta || aposta <= 0) {
      return message.reply('❌ Use: !duelo @user <valor>');
    }

    // 🔒 cooldown
    if (cooldown.has(autor.id)) {
      return message.reply('⏳ Aguarde para iniciar outro duelo.');
    }

    const db = getDB();

    if (db.users[autor.id] === undefined) db.users[autor.id] = 10000;
    if (db.users[alvo.id] === undefined) db.users[alvo.id] = 10000;

    if (db.users[autor.id] < aposta) {
      return message.reply(`💸 Você só tem ${db.users[autor.id]}`);
    }

    if (db.users[alvo.id] < aposta) {
      return message.reply(`💸 ${alvo.username} não tem saldo.`);
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔️ DESAFIO DE DUELO')
      .setDescription(
        `👤 ${autor} desafiou ${alvo}\n\n` +
        `💰 Aposta: ${aposta}\n\n` +
        `Aceita o duelo?`
      )
      .setColor('#ef4444');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aceitar')
        .setLabel('✅ Aceitar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('recusar')
        .setLabel('❌ Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== alvo.id) {
        return interaction.reply({
          content: '❌ Só o desafiado pode responder.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      if (interaction.customId === 'recusar') {
        return msg.edit({
          content: '❌ Duelo recusado.',
          embeds: [],
          components: []
        });
      }

      // ================= INICIO DO DUELO
      db.users[autor.id] -= aposta;
      db.users[alvo.id] -= aposta;
      saveDB(db);

      let vida1 = 100;
      let vida2 = 100;

      const dueloID = `${autor.id}_${alvo.id}`;
      duelosAtivos.set(dueloID, true);

      function embedDuelo() {
        return new EmbedBuilder()
          .setTitle('⚔️ DUELO EM ANDAMENTO')
          .setDescription(
            `👤 ${autor.username}: ${vida1}❤️\n` +
            `👤 ${alvo.username}: ${vida2}❤️`
          )
          .setColor('#0f172a');
      }

      await msg.edit({
        embeds: [embedDuelo()],
        components: []
      });

      const interval = setInterval(() => {

        if (!duelosAtivos.get(dueloID)) {
          clearInterval(interval);
          return;
        }

        const dano1 = Math.floor(Math.random() * 20) + 5;
        const dano2 = Math.floor(Math.random() * 20) + 5;

        vida1 -= dano2;
        vida2 -= dano1;

        msg.edit({ embeds: [embedDuelo()] });

        if (vida1 <= 0 || vida2 <= 0) {
          clearInterval(interval);
          duelosAtivos.delete(dueloID);

          let vencedor;

          if (vida1 > vida2) vencedor = autor;
          else vencedor = alvo;

          const premio = aposta * 2;

          const db = getDB();
          db.users[vencedor.id] += premio;
          saveDB(db);

          msg.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle('🏆 DUELO FINALIZADO')
                .setDescription(
                  `👑 Vencedor: ${vencedor}\n` +
                  `💰 Ganhou: ${premio}`
                )
                .setColor('#22c55e')
            ]
          });
        }

      }, 2000);

    });

    collector.on('end', () => {
      cooldown.set(autor.id, true);
      setTimeout(() => cooldown.delete(autor.id), 10000);
    });

  });

};
