const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== READY =====
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== ENVIAR PAINEL SUPORTE =====
  const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

  if (canal) {
    const mensagens = await canal.messages.fetch({ limit: 10 });
    const jaTem = mensagens.some(m => m.author.id === client.user.id);

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
  }
});

// ===== COMANDOS (!) =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'ping') {
    return message.reply('Pong!');
  }

  if (cmd === 'ticket') {
    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Central de Suporte')
      .setDescription('Clique no botão abaixo para abrir um ticket.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (cmd === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const quantidade = parseInt(args[0]);
    if (!quantidade) return message.reply('Coloca um número.');

    await message.channel.bulkDelete(quantidade, true);
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (interaction) => {if (interaction.isButton()) {

    // ===== ABRIR TICKET =====
    if (interaction.customId === 'abrir_ticket') { client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

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

    // 🔥 DESCRIÇÃO IGUAL A QUE VOCÊ MANDOU
    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Suporte - Ticket')
      .setDescription(
        `Olá ${interaction.user}!\n` +
        `Explique seu problema com detalhes e aguarde a equipe responder.\n` +
        `🔒 Apenas você e a staff podem ver este canal.`
      );

    // 🔥 BOTÕES COMPLETOS (COM ASSUMIR)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('assumir_ticket')
        .setLabel('👮 Assumir Ticket')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('avisar_user')
        .setLabel('🔔 Avisar Usuário')
        .setStyle(ButtonStyle.Secondary)
    );

    await canal.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `✅ Ticket criado: ${canal}`,
      ephemeral: true
    });
  }

  // ===== FECHAR =====
  if (interaction.customId === 'fechar_ticket') {
    await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 2000);
  }

  // ===== ASSUMIR =====
  if (interaction.customId === 'assumir_ticket') {
    await interaction.reply({
      content: `👮 ${interaction.user} assumiu este ticket`
    });
  }

  // ===== AVISAR =====
  if (interaction.customId === 'avisar_user') {
    const user = interaction.channel.name.split('ticket-')[1];

    await interaction.channel.send(`🔔 Atenção <@${interaction.user.id}> respondeu seu ticket!`);

    await interaction.reply({
      content: 'Usuário avisado!',
      ephemeral: true
    });
  }

});

      });

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Suporte - Ticket')
        .setDescription(
          `Olá ${interaction.user}!\nExplique seu problema com detalhes e aguarde a equipe responder.\n🔒 Apenas você e a staff podem ver este canal.`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await canal.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        ephemeral: true
      });
    }

    // ===== FECHAR TICKET =====
    if (interaction.customId === 'fechar_ticket') {
      await interaction.reply({ content: '🔒 Fechando...', ephemeral: true });
      setTimeout(() => interaction.channel.delete(), 2000);
    }
  }

});

// ===== LOGIN =====
client.login(process.env.TOKEN);
