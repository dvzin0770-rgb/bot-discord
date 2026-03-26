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

// ===== READY =====
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} online`);
});

// ===== COMANDOS =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'ping') return message.reply('Pong!');

  if (cmd === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const q = parseInt(args[0]);
    if (!q) return message.reply('Número inválido');
    await message.channel.bulkDelete(q, true);
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  // ===== TICKET =====
  if (interaction.customId === 'abrir_ticket') {

    await interaction.deferReply({ ephemeral: true });

    const categoria = interaction.guild.channels.cache.find(
      c => c.name === '「❄️」丨SUPORTE'
    );

    const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Staff');

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
        .setCustomId('assumir')
        .setLabel('👮 Assumir Ticket')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('fechar')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('avisar')
        .setLabel('🔔 Avisar Usuário')
        .setStyle(ButtonStyle.Secondary)
    );

    await canal.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    return interaction.editReply({ content: `✅ Ticket criado: ${canal}` });
  }

  // ===== BOTÕES =====
  if (interaction.customId === 'assumir') {
    return interaction.reply({ content: `👮 ${interaction.user} assumiu o ticket` });
  }

  if (interaction.customId === 'fechar') {
    await interaction.reply({ content: '🔒 Fechando...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 2000);
  }

  if (interaction.customId === 'avisar') {
    await interaction.channel.send(`🔔 ${interaction.user} respondeu!`);
    return interaction.reply({ content: 'Avisado!', ephemeral: true });
  }

  // ===== RECRUTAMENTO =====
  if (interaction.customId === 'aplicar') {

    await interaction.deferReply({ ephemeral: true });

    const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Staff');

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
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        },
        {
          id: staffRole?.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    await canal.send(`📩 ${interaction.user}, responda:`);

    const perguntas = [
      'Qual seu nick?',
      'Qual sua idade?',
      'Quanto de bounty?',
      'Qual plataforma?'
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

// ===== LOGIN =====
client.login(process.env.TOKEN);
