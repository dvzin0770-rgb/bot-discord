const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

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

    // ===== XP =====
    db[id].mensagens += 1;

    const newLevel = getLevel(db[id].mensagens);

    if (newLevel > db[id].level) {
      db[id].level = newLevel;

      await message.reply(`🎉 ${message.author} subiu para o nível ${newLevel}!`);

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

    // ===== COMANDOS =====

    // !level
    if (message.content.startsWith('!level')) {
      const user = message.mentions.users.first() || message.author;
      const data = db[user.id] || { mensagens: 0, level: 0 };

      const embed = new EmbedBuilder()
        .setTitle('📊 Level')
        .setDescription(`${user}`)
        .addFields(
          { name: '📨 Mensagens', value: `${data.mensagens}`, inline: true },
          { name: '📈 Nível', value: `${data.level}`, inline: true }
        )
        .setColor('#5865F2');

      return message.reply({ embeds: [embed] });
    }

    // !top
    if (message.content === '!top') {
      const ranking = Object.entries(db)
        .sort((a, b) => b[1].mensagens - a[1].mensagens)
        .slice(0, 10);

      const desc = ranking.map((user, i) => {
        return `**${i + 1}°** <@${user[0]}> - ${user[1].mensagens} msgs`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Mensagens')
        .setDescription(desc || 'Sem dados')
        .setColor('#FFD700');

      return message.reply({ embeds: [embed] });
    }

    // !perfil
    if (message.content.startsWith('!perfil')) {
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
          { name: '🏆 Ranking', value: `#${pos || 'N/A'}`, inline: true }
        )
        .setColor('#00FFAA');

      return message.reply({ embeds: [embed] });
    }

  });

};
