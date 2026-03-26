client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton()) {

    // ===== ABRIR TICKET =====
    if (interaction.customId === 'abrir_ticket') {

      const categoria = interaction.guild.channels.cache.find(
        c => c.name === '「❄️」丨SUPORTE' && c.type === 4
      );

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        parent: categoria?.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel']
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages']
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Suporte - Ticket')
        .setDescription(
          `Olá ${interaction.user}!\n` +
          'Explique seu problema com detalhes e aguarde a equipe responder.\n' +
          '🔒 Apenas você e a staff podem ver este canal.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await canal.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        ephemeral: true
      });
    }

    // ===== FECHAR TICKET =====
    if (interaction.customId === 'fechar_ticket') {
      await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete();
      }, 2000);
    }
  }
});
