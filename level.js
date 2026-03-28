const fs = require('fs');
const RANKING_PATH = './ranking.json'; // 👈 ADICIONADO

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {

  const DB_PATH = './level.json';

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }

  const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
  const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  const getLevel = (msgs) => Math.floor(msgs / 75);
  const cargosLevel = [5, 10, 20, 30, 50];

  // ===== XP =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const db = getDB();
    const id = message.author.id;

    if (!db[id]) db[id] = { mensagens: 0, level: 0 };

    db[id].mensagens += 1;

    const newLevel = getLevel(db[id].mensagens);

    if (newLevel > db[id].level) {
      db[id].level = newLevel;

      message.channel.send(`🎉 ${message.author} subiu para o nível ${newLevel}!`);

      if (cargosLevel.includes(newLevel)) {
        let role = message.guild.roles.cache.find(r => r.name === `lvl-${newLevel}`);

        if (!role) {
          role = await message.guild.roles.create({
            name: `lvl-${newLevel}`,
            color: 'Random'
          });
        }

        const member = await message.guild.members.fetch(id);
        if (member) await member.roles.add(role);
      }
    }

    saveDB(db);
  });

  // ===== !LEVEL / !PERFIL =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!level') && !message.content.startsWith('!perfil')) return;

    const db = getDB();
    const user = message.mentions.users.first() || message.author;
    const data = db[user.id] || { mensagens: 0, level: 0 };

    const ranking = Object.entries(db)
      .sort((a, b) => b[1].mensagens - a[1].mensagens);

    const pos = ranking.findIndex(u => u[0] === user.id) + 1;

    const embed = new EmbedBuilder()
      .setTitle('👤 Perfil')
      .setDescription(`${user}`)
      .addFields(
        { name: '📨 Mensagens', value: `${data.mensagens}`, inline: true },
        { name: '📈 Nível', value: `${data.level}`, inline: true },
        { name: '🏆 Ranking', value: pos > 0 ? `#${pos}` : 'N/A', inline: true }
      )
      .setColor('#5865F2');

    message.reply({ embeds: [embed] });
  });

  // ===== !TOP COM BOTÕES =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content !== '!top') return;

    const db = getDB();

    const ranking = Object.entries(db)
      .sort((a, b) => b[1].mensagens - a[1].mensagens);

    let page = 0;
    const perPage = 10;

    function gerarEmbed() {
      const start = page * perPage;
      const current = ranking.slice(start, start + perPage);

      const desc = current.map((u, i) => {
        return `**${start + i + 1}°** <@${u[0]}> - ${u[1].mensagens} mensagens`;
      }).join('\n');

      return new EmbedBuilder()
        .setTitle('🏆 Ranking do Servidor')
        .setDescription(desc || 'Sem dados')
        .setFooter({ text: `Página ${page + 1}` })
        .setColor('#FFD700');
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({
      embeds: [gerarEmbed()],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 600000 });

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Só quem executou pode usar.', ephemeral: true });
      }

      if (interaction.customId === 'next') {
        if ((page + 1) * perPage < ranking.length) page++;
      }

      if (interaction.customId === 'prev') {
        if (page > 0) page--;
      }

      await interaction.update({
        embeds: [gerarEmbed()],
        components: [row]
      });
    });
  });

};
