const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const emojis = ['🍒', '🍋', '🍉', '💎', '💣'];

function girar() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (!message.content.startsWith('!slot')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);

    if (!aposta) {
      return message.reply('❌ Use: !slot <valor>');
    }

    const db = getDB();
    const id = message.author.id;

    if (db[id] === undefined) db[id] = 0;

    if (db[id] < aposta) {
      return message.reply('❌ Você não tem saldo suficiente.');
    }

    db[id] -= aposta;
    saveDB(db);

    // 🎰 EMBED INICIAL
    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('🎰 SLOT — FROSTVOW')
      .setDescription('```🎲 Girando...\n\n[ ⬜ | ⬜ | ⬜ ]```')
      .setFooter({ text: `Aposta: ${aposta}` });

    const msg = await message.channel.send({ embeds: [embed] });

    // 🎲 ANIMAÇÃO (fake)
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 700));

      const temp = `[ ${girar()} | ${girar()} | ${girar()} ]`;

      await msg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🎰 SLOT — FROSTVOW')
            .setDescription(`\`\`\`🎲 Girando...\n\n${temp}\`\`\``)
        ]
      });
    }

    // 🎯 RESULTADO FINAL
    const r1 = girar();
    const r2 = girar();
    const r3 = girar();

    let ganho = 0;
    let resultadoTipo = 'perdeu';

    if (r1 === r2 && r2 === r3) {
      if (r1 === '💎') {
        ganho = aposta * 5;
        resultadoTipo = 'jackpot';
      } else if (r1 === '💣') {
        ganho = 0;
        resultadoTipo = 'explosao';
      } else {
        ganho = aposta * 3;
        resultadoTipo = 'win';
      }
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      ganho = aposta * 2;
      resultadoTipo = 'win';
    }

    db[id] += ganho;
    saveDB(db);

    const resultado = `[ ${r1} | ${r2} | ${r3} ]`;

    let cor = '#e74c3c';
    let titulo = '💀 Você perdeu!';
    let descExtra = 'Melhor sorte na próxima...';

    if (resultadoTipo === 'win') {
      cor = '#2ecc71';
      titulo = '🎉 Vitória!';
      descExtra = `Você ganhou **${ganho} moedas!**`;
    }

    if (resultadoTipo === 'jackpot') {
      cor = '#f1c40f';
      titulo = '💎 JACKPOT!!!';
      descExtra = `🔥 Você ganhou **${ganho} moedas!!!**`;
    }

    if (resultadoTipo === 'explosao') {
      cor = '#c0392b';
      titulo = '💣 EXPLODIU!';
      descExtra = 'Você perdeu tudo 💀';
    }

    const finalEmbed = new EmbedBuilder()
      .setColor(cor)
      .setTitle(`🎰 SLOT — FROSTVOW`)
      .setDescription(
        `\`\`\`\n${resultado}\n\`\`\`\n\n` +
        `💰 Aposta: **${aposta}**\n` +
        `📊 Resultado: **+${ganho}**\n\n` +
        `${titulo}\n${descExtra}`
      )
      .addFields({
        name: '🏦 Saldo atual',
        value: `**${db[id]} moedas**`
      })
      .setFooter({ text: 'Frostvow Cassino' })
      .setTimestamp();

    await msg.edit({ embeds: [finalEmbed] });

  });

};
