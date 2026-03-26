const { EmbedBuilder } = require('discord.js');

const afk = new Map();

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ===== BASICOS =====

    if (cmd === 'ping') {
      return message.reply('🏓 Pong!');
    }

    if (cmd === 'avatar') {
      const user = message.mentions.users.first() || message.author;
      return message.reply(user.displayAvatarURL({ size: 1024 }));
    }

    if (cmd === 'userinfo') {
      const user = message.mentions.users.first() || message.author;

      const embed = new EmbedBuilder()
        .setTitle('👤 User Info')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Nome', value: user.tag },
          { name: 'ID', value: user.id }
        );

      return message.channel.send({ embeds: [embed] });
    }

    if (cmd === 'serverinfo') {
      const embed = new EmbedBuilder()
        .setTitle('🌐 Server Info')
        .addFields(
          { name: 'Nome', value: message.guild.name },
          { name: 'Membros', value: `${message.guild.memberCount}` }
        );

      return message.channel.send({ embeds: [embed] });
    }

    // ===== AFK =====
    if (cmd === 'afk') {
      afk.set(message.author.id, args.join(' ') || 'AFK');
      return message.reply('Você está AFK!');
    }

    if (message.mentions.users.first()) {
      const user = message.mentions.users.first();
      if (afk.has(user.id)) {
        message.reply(`⚠️ ${user.tag} está AFK: ${afk.get(user.id)}`);
      }
    }

    if (afk.has(message.author.id)) {
      afk.delete(message.author.id);
      message.reply('Você voltou do AFK!');
    }

    // ===== BLOX FRUITS =====
    const frutas = ['Dragon', 'Leopard', 'Dough', 'Light', 'Magma', 'Ice'];

    if (cmd === 'fruta') {
      const fruta = frutas[Math.floor(Math.random() * frutas.length)];
      return message.reply(`🍍 Fruta sorteada: **${fruta}**`);
    }

    if (cmd === 'build') {
      const builds = ['Espada + Blox Fruit', 'Gun + Fruit', 'Full Melee'];
      const build = builds[Math.floor(Math.random() * builds.length)];
      return message.reply(`⚔️ Build recomendada: **${build}**`);
    }

    if (cmd === 'farm') {
      return message.reply('📍 Vá farmar em ilhas do seu nível!');
    }

    if (cmd === 'codigos') {
      return message.reply('🎁 Procure códigos atualizados no Twitter oficial!');
    }

    // ===== DIVERSÃO =====

    if (cmd === 'ship') {
      const porcentagem = Math.floor(Math.random() * 100);
      return message.reply(`💘 Compatibilidade: ${porcentagem}%`);
    }

    if (cmd === '8ball') {
      const respostas = ['Sim', 'Não', 'Talvez', 'Claro', 'Nunca'];
      const r = respostas[Math.floor(Math.random() * respostas.length)];
      return message.reply(`🎱 ${r}`);
    }

    if (cmd === 'luck') {
      const sorte = Math.floor(Math.random() * 100);
      return message.reply(`🍀 Sua sorte hoje: ${sorte}%`);
    }

    if (cmd === 'duelo') {
      const winner = Math.random() > 0.5 ? 'Você venceu!' : 'Você perdeu!';
      return message.reply(`⚔️ ${winner}`);
    }

    // ===== UTIL =====

    if (cmd === 'enquete') {
      const msg = await message.channel.send(`📊 ${args.join(' ')}`);
      await msg.react('👍');
      await msg.react('👎');
    }

    if (cmd === 'embed') {
      const embed = new EmbedBuilder()
        .setDescription(args.join(' '))
        .setColor('Blue');

      return message.channel.send({ embeds: [embed] });
    }

  });

};
