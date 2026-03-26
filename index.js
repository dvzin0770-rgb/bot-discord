const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const comandos = require('./comandos');
const recrutamento = require('./recrutamento');
const staff = require('./staff');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// SISTEMAS
comandos(client);
recrutamento(client);
staff(client);

// BOT ONLINE
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== PAINEL SUPORTE (PROFISSIONAL) =====
  const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

  if (canal) {
    const msgs = await canal.messages.fetch({ limit: 10 });
    const jaExiste = msgs.find(m => m.author.id === client.user.id);

    if (!jaExiste) {

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Central de Suporte')
        .setDescription(
          'Se precisar de ajuda, abra um ticket e nossa equipe irá te atender.\n\n' +
          '📋 **Como funciona?**\n' +
          'Clique no botão abaixo para criar um canal privado.\n\n' +
          '⏱️ **Tempo de resposta**\n' +
          'Respondemos o mais rápido possível.\n\n' +
          '🔒 **Privacidade**\n' +
          'Apenas você e a staff podem ver.'
        )
        .setFooter({ text: 'Sistema de suporte' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('🎟️ Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      canal.send({ embeds: [embed], components: [row] });
    }
  }

  // ===== PAINEL RECRUTAMENTO =====
  const recrut = client.channels.cache.find(c =>
    c.name === '📜丨recrutamento' || c.name === 'recrutamento'
  );

  if (recrut) {
    const msgs = await recrut.messages.fetch({ limit: 10 });
    const jaExiste = msgs.find(m => m.author.id === client.user.id);

    if (!jaExiste) {
      recrutamento.enviarPainel(recrut);
    }
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  // ===== ABRIR TICKET =====
  if (interaction.customId === 'abrir_ticket') {

    await interaction.deferReply({ ephemeral: true });

    const canal = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: 0,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Suporte - Ticket')
      .setDescription(
        `Olá ${interaction.user}!\n\n` +
        'Explique seu problema com o máximo de detalhes possível e aguarde a equipe.\n\n' +
        '🔒 Apenas você e a staff podem ver este canal.'
      )
      .setFooter({ text: 'Equipe de suporte' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('assumir_ticket')
        .setLabel('👮 Assumir Ticket')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    await interaction.editReply({
      content: `✅ Seu ticket foi criado: ${canal}`
    });
  }

  // ===== ASSUMIR =====
  if (interaction.customId === 'assumir_ticket') {
    await interaction.reply({
      content: `👮 ${interaction.user} assumiu este ticket`
    });
  }

  // ===== FECHAR =====
  if (interaction.customId === 'fechar_ticket') {
    await interaction.reply({
      content: '🔒 Fechando ticket...',
      ephemeral: true
    });

    setTimeout(() => {
      interaction.channel.delete();
    }, 2000);
  }

});

client.login(process.env.DISCORD_TOKEN);
