const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  const DB_PATH = './level.json';

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }

  function getDB() {
    return JSON.parse(fs.readFileSync(DB_PATH));
  }

  function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  function getLevel(msgs) {
    return Math.floor(msgs / 75);
  }

  const cargosLevel = [5, 10, 20, 30, 50];

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const db = getDB();
    const id = message.author.id;

    if (!db[id]) db[id] = { mensagens: 0, level: 0 };

    db[id].mensagens += 1;

    const newLevel = getLevel(db[id].mensagens);

    // UP DE LEVEL
    if (newLevel > db[id].level) {
      db[id].level = newLevel;

      await message.reply(`🎉 ${message.author} subiu para o nível ${newLevel}!`);

      // DAR CARGO SE FOR LEVEL ESPECÍFICO
      if (cargosLevel.includes(newLevel)) {
        let role = message.guild.roles.cache.find(r => r.name === `lvl-${newLevel}`);

        if (!role) {
          role = await message.guild.roles.create({
            name: `lvl-${newLevel}`,
            color: 'Random'
          });
        }

        const member = message.guild.members.cache.get(id);
        if (member) await member.roles.add(role);
      }
    }

    saveDB(db);
  });

  // ===== RANKING =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content !== '!rank') return;

    const db = getDB();

    const ranking = Object.entries(db)
      .sort((a, b) => b[1].mensagens - a[1].mensagens);

    let page = 0;
    const perPage = 5;

    function gerarEmbed() {
      const start = page * perPage;
      const current = ranking.slice(start, start + perPage);

      const desc = current.map((user, i) => {
        const pos = start + i + 1;
        return `**${pos}°** <@${user[0]}>: ${user[1].mensagens} mensagens`;
      }).join('\n');

      return new EmbedBuilder()
        .setTitle('🏆 Ranking de Mensagens')
        .setDescription(desc || 'Sem dados')
        .setColor('#FFD700')
        .setFooter({ text: `Página ${page + 1}` });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({
      embeds: [gerarEmbed()],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({ content: '❌ Só quem abriu pode usar.', ephemeral: true });

      if (i.customId === 'next') page++;
      if (i.customId === 'prev') page--;

      if (page < 0) page = 0;
      if (page >= Math.ceil(ranking.length / perPage)) page--;

      await i.update({
        embeds: [gerarEmbed()],
        components: [row]
      });
    });
  });

};
