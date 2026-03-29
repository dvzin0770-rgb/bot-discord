const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DB_PATH = './economia.json';

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (!message.content.startsWith('!coin')) return;

    const args = message.content.split(' ');
    const aposta = parseInt(args[1]);
    const escolha = args[2]?.toLowerCase();

    if (!aposta || !['cara', 'coroa'].includes(escolha)) {
      return message.reply('❌ Use: !coin <valor> <cara/coroa>');
    }

    const db = getDB();
    const id = message.author.id;

    if (db[id] === undefined) db[id] = 0;

    if (db[id] < aposta) {
      return message.reply('❌ Você não tem saldo suficiente.');
    }

    db[id] -= aposta;
    saveDB(db);

    // 🪙 EMBED INICIAL
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🪙 Cara ou Coroa — Frostvow')
      .setDescription(
        `💰 Aposta: **${aposta}**\n` +
        `🎯 Escolha: **${escolha}**\n\n` +
        `🪙 Jogando a moeda...`
      );

    const msg = await message.channel.send({ embeds: [embed] });

    // 🎲 ANIMAÇÃO
    const anim = ['🪙', '💫', '🪙', '💫', '🪙'];
    for (let i = 0; i < anim.length; i++) {
      await new Promise(r => setTimeout(r, 400));

      await msg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🪙 Cara ou Coroa — Frostvow')
            .setDescription(`\n\n${anim[i]} Girando... ${anim[i]}`)
        ]
      });
    }

    // 🎯 RESULTADO
    const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';

    let ganhou = resultado === escolha;
    let ganho = ganhou ? aposta * 2 : 0;

    db[id] += ganho;
    saveDB(db);

    let cor = ganhou ? '#2ecc71' : '#e74c3c';
    let titulo = ganhou ? '🎉 Você ganhou!' : '💀 Você perdeu!';
    let texto = ganhou
      ? `Você ganhou **${ganho} moedas!**`
      : `Você perdeu **${aposta} moedas...**`;

    const finalEmbed = new EmbedBuilder()
      .setColor(cor)
      .setTitle('🪙 Cara ou Coroa — Frostvow')
      .setDescription(
        `🪙 Resultado: **${resultado.toUpperCase()}**\n\n` +
        `🎯 Sua escolha: **${escolha.toUpperCase()}**\n` +
        `💰 Aposta: **${aposta}**\n\n` +
        `${titulo}\n${texto}`
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
