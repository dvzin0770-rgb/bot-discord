const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= READY =================
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== PAINEL SUPORTE =====
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

  // ===== PAINEL RECRUTAMENTO =====
  const recrutamento = client.channels.cache.find(c => c.name === '📜丨recrutamento');

  if (recrutamento) {
    const msgs2 = await recrutamento.messages.fetch({ limit: 10 });
    const jaTem2 = msgs2.some(m => m.author.id === client.user.id);

    if (!jaTem2) {
      const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('⚓ Recrutamento da Tripulação')
        .setDescription(
          'Quer fazer parte da nossa tripulação?\nClique no botão abaixo e preencha o formulário!\n\n' +
          '📋 **Requisitos**\n• Ser ativo\n• Ter bom comportamento\n• Seguir as regras\n\n' +
          '⏳ **Processo**\nSua candidatura será analisada pela staff.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('aplicar')
          .setLabel('📩 Aplicar')
          .setStyle(ButtonStyle.Success)
      );

      recrutamento.send({ embeds: [embed], components: [row] });
    }
  }

});

// ================= COMANDOS =================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'ping') return message.reply('Pong!');

  if (cmd === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const q = parseInt(args[0]);
    if (!q) return message.reply('Coloque um número.');
    await message.channel.bulkDelete(q, true);
  }

  if (cmd === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const user = message.mentions.members.first();
    if (!user) return;
    await user.kick();
    message.reply('Usuário kickado.');
  }

  if (cmd === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    const user = message.mentions.members.first();
    if (!user) return;
    await user.ban();
    message.reply('Usuário banido.');
  }

});

// ================= INTERAÇÕES =================
client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

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
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Suporte - Ticket')
      .setDescription(
        `Olá ${interaction.user}!\nExplique seu problema.\n🔒 Apenas você e a staff podem ver.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('assumir').setLabel('👮 Assumir').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('avisar').setLabel('🔔 Avisar').setStyle(ButtonStyle.Secondary)
    );

    await canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

    return interaction.editReply({ content: `✅ Ticket criado: ${canal}` });
  }

  // ===== BOTÕES TICKET =====
  if (interaction.customId === 'assumir') {
    return interaction.reply({ content: `${interaction.user} assumiu o ticket.` });
  }

  if (interaction.customId === 'fechar') {
    await interaction.reply({ content: 'Fechando...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 2000);
  }

  if (interaction.customId === 'avisar') {
    await interaction.channel.send(`🔔 ${interaction.user} respondeu!`);
    return interaction.reply({ content: 'Avisado.', ephemeral: true });
  }

  // ===== RECRUTAMENTO =====
  if (interaction.customId === 'aplicar') {

    await interaction.deferReply({ ephemeral: true });

    const canal = await interaction.guild.channels.create({
      name: `recrutamento-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    await canal.send(`📩 ${interaction.user}, responda:`);

    const perguntas = [
      'Nick?',
      'Idade?',
      'Bounty?',
      'Plataforma?'
    ];

    let i = 0;
    const respostas = [];

    const collector = canal.createMessageCollector({
      filter: m => m.author.id === interaction.user.id,
      time: 300000
    });

    canal.send(perguntas[i]);

    collector.on('collect', msg => {
      respostas.push(msg.content);
      i++;

      if (i < perguntas.length) {
        canal.send(perguntas[i]);
      } else {
        collector.stop();
        canal.send('✅ Enviado para staff.');
      }
    });

    return interaction.editReply({ content: `📩 Canal criado: ${canal}` });
  }

});

// ================= LOGIN =================
client.login(process.env.TOKEN);
