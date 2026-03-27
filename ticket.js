module.exports = (client) => {
  const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require('discord.js');

  const STAFF_ROLE_NAME = '⃤⃟⃝Suporte';

  client.once('ready', async () => {
    const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

    if (!canal) return console.log('Canal de suporte não encontrado');

    const mensagens = await canal.messages.fetch({ limit: 10 });
    const jaTem = mensagens.some(m => m.author.id === client.user.id);

    if (jaTem) return;

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
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      const staffRole = interaction.guild.roles.cache.find(
        r => r.name === STAFF_ROLE_NAME
      );

      const isStaff = staffRole && interaction.member.roles.cache.has(staffRole.id);

      // ===== ABRIR TICKET =====
      if (interaction.customId === 'abrir_ticket') {

        await interaction.deferReply({ ephemeral: true });

        const categoria = interaction.guild.channels.cache.find(
          c => c.name === '「❄️」丨SUPORTE'
        );

        if (!categoria) {
          return interaction.editReply({ content: '❌ Categoria não encontrada.' });
        }

        const canal = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0,
          parent: categoria.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages']
            },
            ...(staffRole ? [{
              id: staffRole.id,
              allow: ['ViewChannel', 'SendMessages']
            }] : [])
          ]
        });

        const embed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setTitle('🎫 Ticket de Suporte')
          .setDescription(
            `Olá ${interaction.user}!\n\n` +
            `Explique seu problema com detalhes.\n` +
            `A equipe irá te responder em breve.\n\n` +
            `🔒 Apenas você e a equipe podem ver este canal.`
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('assumir_ticket')
            .setLabel('👮 Assumir')
            .setStyle(ButtonStyle.Secondary),

          new ButtonBuilder()
            .setCustomId('avisar_usuario')
            .setLabel('🔔 Avisar')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('fechar_ticket')
            .setLabel('🔒 Fechar')
            .setStyle(ButtonStyle.Danger)
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

        if (!isStaff) {
          return interaction.reply({
            content: '❌ Apenas a equipe pode usar isso.',
            ephemeral: true
          });
        }

        return interaction.reply({
          content: `👮 ${interaction.user} assumiu este ticket.`,
        });
      }

      // ===== AVISAR =====
      if (interaction.customId === 'avisar_usuario') {

        if (!isStaff) {
          return interaction.reply({
            content: '❌ Apenas a equipe pode usar isso.',
            ephemeral: true
          });
        }

        await interaction.channel.send(
          `🔔 ${interaction.user} pediu atenção no ticket!`
        );

        return interaction.reply({
          content: '✅ Aviso enviado!',
          ephemeral: true
        });
      }

      // ===== FECHAR =====
      if (interaction.customId === 'fechar_ticket') {

        if (!isStaff) {
          return interaction.reply({
            content: '❌ Apenas a equipe pode fechar.',
            ephemeral: true
          });
        }

        await interaction.reply({
          content: '🔒 Fechando ticket...',
          ephemeral: true
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 2000);
      }

    } catch (err) {
      console.error(err);

      if (interaction.deferred || interaction.replied) {
        interaction.editReply({ content: '❌ Erro no ticket.' });
      } else {
        interaction.reply({ content: '❌ Erro no ticket.', ephemeral: true });
      }
    }
  });
};
