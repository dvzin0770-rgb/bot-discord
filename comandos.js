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
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

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
    // 🎫 TICKET
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
        return message.reply(`⚠️ ${user.tag} está AFK: ${afk.get(user.id)}`);
      }
    }

    if (afk.has(message.author.id)) {
      afk.delete(message.author.id);
      message.reply('👋 Você voltou do AFK.');
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

  });

};
