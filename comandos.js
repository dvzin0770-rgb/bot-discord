const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const afk = new Map();

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();

    // =========================
    // 🟢 BÁSICOS
    // =========================

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
        .setColor('#2B2D31')
        .setTitle('👤 Informações do Usuário')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Nome', value: user.tag },
          { name: 'ID', value: user.id }
        );

      return message.channel.send({ embeds: [embed] });
    }

    if (cmd === 'serverinfo') {
      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🌐 Informações do Servidor')
        .addFields(
          { name: 'Nome', value: message.guild.name },
          { name: 'Membros', value: `${message.guild.memberCount}` }
        );

      return message.channel.send({ embeds: [embed] });
    }

    // =========================
    // 🎫 TICKET (COMANDO)
    // =========================

    if (cmd === 'ticket') {

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Central de Suporte')
        .setDescription(
          'Precisa de ajuda? Clique no botão abaixo para abrir um ticket.\n\n' +
          '📋 Atendimento privado com a equipe.\n' +
          '🔒 Apenas você e a staff terão acesso.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('🎟️ Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    // =========================
    // 💤 AFK
    // =========================

    if (cmd === 'afk') {
      afk.set(message.author.id, args.join(' ') || 'AFK');
      return message.reply('💤 Você está AFK agora.');
    }

    if (message.mentions.users.first()) {
      const user = message.mentions.users.first();
      if (afk.has(user.id)) {
        message.reply(`⚠️ ${user.tag} está AFK: ${afk.get(user.id)}`);
      }
    }

    if (afk.has(message.author.id)) {
      afk.delete(message.author.id);
      message.reply('👋 Você voltou do AFK.');
    }

    // =========================
    // 🍍 BLOX FRUITS
    // =========================

    const frutas = ['Dragon', 'Leopard', 'Dough', 'Light', 'Magma', 'Ice'];

    if (cmd === 'fruta') {
      const fruta = frutas[Math.floor(Math.random() * frutas.length)];
      return message.reply(`🍍 Fruta sorteada: **${fruta}**`);
    }

    if (cmd === 'build') {
      const builds = ['Espada + Fruit', 'Gun + Fruit', 'Full Melee'];
      const build = builds[Math.floor(Math.random() * builds.length)];
      return message.reply(`⚔️ Build recomendada: **${build}**`);
    }

    if (cmd === 'farm') {
      return message.reply('📍 Vá farmar em ilhas compatíveis com seu nível.');
    }

    if (cmd === 'codigos') {
      return message.reply('🎁 Procure códigos no Twitter oficial do Blox Fruits.');
    }

    // =========================
    // 🎮 DIVERSÃO
    // =========================

    if (cmd === 'ship') {
      const porcentagem = Math.floor(Math.random() * 100);
      return message.reply(`💘 Compatibilidade: ${porcentagem}%`);
    }

    if (cmd === '8ball') {
      const respostas = ['Sim', 'Não', 'Talvez', 'Com certeza', 'Nunca'];
      const r = respostas[Math.floor(Math.random() * respostas.length)];
      return message.reply(`🎱 ${r}`);
    }

    if (cmd === 'luck') {
      return message.reply(`🍀 Sorte do dia: ${Math.floor(Math.random() * 100)}%`);
    }

    if (cmd === 'duelo') {
      return message.reply(Math.random() > 0.5 ? '⚔️ Você venceu!' : '💀 Você perdeu!');
    }

    // =========================
    // 📊 UTIL
    // =========================

    if (cmd === 'enquete') {
      const texto = args.join(' ');
      if (!texto) return message.reply('Digite algo para a enquete.');

      const msg = await message.channel.send(`📊 ${texto}`);
      await msg.react('👍');
      await msg.react('👎');
    }

    if (cmd === 'embed') {
      const texto = args.join(' ');
      if (!texto) return;

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setDescription(texto);

      return message.channel.send({ embeds: [embed] });
    }

    // =========================
    // 🛠️ MODERAÇÃO
    // =========================

    if (cmd === 'clear') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return message.reply('❌ Sem permissão.');

      const quantidade = parseInt(args[0]);
      if (!quantidade) return message.reply('Coloque um número.');

      await message.channel.bulkDelete(quantidade, true);
      message.channel.send(`🧹 ${quantidade} mensagens apagadas.`);
    }

    if (cmd === 'ban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return message.reply('❌ Sem permissão.');

      const user = message.mentions.members.first();
      if (!user) return message.reply('Marca alguém.');

      await user.ban();
      message.channel.send(`🔨 ${user.user.tag} foi banido.`);
    }

    if (cmd === 'kick') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
        return message.reply('❌ Sem permissão.');

      const user = message.mentions.members.first();
      if (!user) return message.reply('Marca alguém.');

      await user.kick();
      message.channel.send(`👢 ${user.user.tag} foi expulso.`);
    }

    if (cmd === 'mute') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return message.reply('❌ Sem permissão.');

      const user = message.mentions.members.first();
      if (!user) return message.reply('Marca alguém.');

      await user.timeout(10 * 60 * 1000);
      message.channel.send(`🔇 ${user.user.tag} foi mutado.`);
    }

    if (cmd === 'nuke') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return message.reply('❌ Sem permissão.');

      const canal = message.channel;
      const novo = await canal.clone();

      await canal.delete();
      novo.send('💥 Canal resetado.');
    }

  });

};
