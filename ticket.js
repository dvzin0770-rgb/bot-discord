const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require('discord.js');

module.exports = (client) => {

  // ===== PAINEL AUTOMÁTICO =====
  client.once('ready', async () => {
    const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');
    if (!canal) return;

    const msgs = await canal.messages.fetch({ limit: 10 });
    const jaTem = msgs.some(m => m.author.id === client.user.id);

    if (!jaTem) {
      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Central de Suporte')
        .setDescription(
          'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
          '📋 **Como funciona?**\nClique no botão abaixo para criar um canal privado com a equipe.\n\n' +
          '⏱️ **Tempo de resposta**\nNossa equipe responde o mais rápido possível.\n\n' +
          '🔒 **Privacidade**\nApenas você e a equipe poderão ver o ticket.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('🎟️ Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      canal.send({ embeds: [embed], components: [row] });
    }
  });

  // ===== COMANDO !ticket =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!ticket')) return;

    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Central de Suporte')
      .setDescription(
        'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
        '📋 **Como funciona?**\nClique no botão abaixo para criar um canal privado com a equipe.\n\n' +
        '⏱️ **Tempo de resposta**\nNossa equipe responde o mais rápido possível.\n\n' +
        '🔒 **Privacidade**\nApenas você e a equipe poderão ver o ticket.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  });

  // ===== INTERAÇÕES =====
  client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

    const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Staff');

    // ===== ABRIR TICKET =====
    if (interaction.customId === 'abrir_ticket') {

      await interaction.deferReply({ ephemeral: true });

      const categoria = interaction.guild.channels.cache.find(
        c => c.name === '「❄️」丨SUPORTE'
      );

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoria?.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          },
          {
            id: staffRole?.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.ManageMessages
            ]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Suporte - Ticket')
        .setDescription(
          `Olá ${interaction.user}!\n` +
          `Explique seu problema com detalhes e aguarde a equipe responder.\n` +
          `🔒 Apenas você e a staff podem ver este canal.`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('assumir_ticket')
          .setLabel('👮 Assumir Ticket')
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('avisar_usuario')
          .setLabel('🔔 Avisar Usuário')
          .setStyle(ButtonStyle.Secondary)
      );

      await canal.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [row]
      });

      return interaction.editReply({
        content: `✅ Ticket criado: ${canal}`
      });
    }

    // ===== ASSUMIR =====
    if (interaction.customId === 'assumir_ticket') {
      if (!interaction.member.roles.cache.has(staffRole?.id)) {
        return interaction.reply({ content: '❌ Apenas staff pode assumir.', ephemeral: true });
      }

      return interaction.reply({
        content: `👮 ${interaction.user} assumiu este ticket`
      });
    }

    // ===== FECHAR =====
    if (interaction.customId === 'fechar_ticket') {
      await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });
      setTimeout(() => interaction.channel.delete(), 2000);
    }

    // ===== AVISAR =====
    if (interaction.customId === 'avisar_usuario') {
      await interaction.channel.send(`🔔 ${interaction.user} respondeu o ticket!`);
      return interaction.reply({ content: 'Usuário avisado!', ephemeral: true });
    }

  });

};
