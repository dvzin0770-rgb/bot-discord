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

const respostas = new Map();

client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== SUPORTE =====
  const suporte = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

  if (suporte) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎫 Central de Suporte')
      .setDescription('Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!')
      .addFields(
        { name: '📋 Como funciona?', value: 'Clique no botão abaixo para criar um canal privado com a equipe.' },
        { name: '⏱️ Tempo de resposta', value: 'Respondemos o mais rápido possível.' },
        { name: '🔒 Privacidade', value: 'Apenas você e a staff podem ver.' }
      )
      .setFooter({ text: 'Suporte • Apenas abra se necessário' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await suporte.send({ embeds: [embed], components: [row] });
  }

  // ===== RECRUTAMENTO =====
  const recrutamento = client.channels.cache.find(c => c.name === '📜丨recrutamento' || c.name === 'recrutamento');

  if (recrutamento) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚓ Recrutamento da Tripulação')
      .setDescription('Quer fazer parte da nossa tripulação?\nClique no botão abaixo e preencha o formulário!')
      .addFields(
        { name: '📋 Requisitos', value: '• Ser ativo\n• Ter bom comportamento\n• Seguir as regras' },
        { name: '⏳ Processo', value: 'Sua candidatura será analisada pela staff.' }
      )
      .setFooter({ text: 'Boa sorte!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aplicar')
        .setLabel('📩 Aplicar')
        .setStyle(ButtonStyle.Success)
    );

    await recrutamento.send({ embeds: [embed], components: [row] });
  }
});

// ================= BOTÕES =================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // ===== TICKET =====
  if (interaction.customId === 'ticket') {
    await interaction.deferReply({ ephemeral: true });

    const canal = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: 0,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
      ]
    });

    await interaction.editReply({ content: `✅ Ticket criado: ${canal}` });

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎫 Suporte - Ticket')
      .setDescription(`Olá ${interaction.user}!\nExplique seu problema.\n\n🔒 Apenas você e a staff podem ver.`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('assumir').setLabel('👮 Assumir').setStyle(ButtonStyle.Primary)
    );

    canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
  }

  if (interaction.customId === 'fechar') {
    await interaction.reply({ content: '🔒 Fechando...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 3000);
  }

  if (interaction.customId === 'assumir') {
    await interaction.reply({ content: `👮 ${interaction.user} assumiu o ticket` });
  }

  // ===== RECRUTAMENTO =====
  if (interaction.customId === 'aplicar') {
    respostas.set(interaction.user.id, []);
    await interaction.reply({ content: 'Qual seu Nick?', ephemeral: true });
  }

  if (interaction.customId === 'aprovar') {
    const id = interaction.message.content;
    const membro = await interaction.guild.members.fetch(id);

    let cargo = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Membros da crew');
    if (!cargo) {
      cargo = await interaction.guild.roles.create({ name: '⃤⃟⃝Membros da crew' });
    }

    await membro.roles.add(cargo);

    await interaction.update({ content: '✅ Aprovado', components: [] });
    membro.send('🎉 Você foi aprovado!');
  }

  if (interaction.customId === 'recusar') {
    const id = interaction.message.content;
    const membro = await interaction.guild.members.fetch(id);

    await interaction.update({ content: '❌ Recusado', components: [] });
    membro.send('❌ Você foi recusado.');
  }
});

// ================= PERGUNTAS =================
client.on('messageCreate', async (msg) => {
  if (!respostas.has(msg.author.id)) return;

  const userRespostas = respostas.get(msg.author.id);
  userRespostas.push(msg.content);

  const perguntas = [
    'Qual seu Nick?',
    'Qual sua idade?',
    'Quanto de bounty você tem?',
    'Joga em qual plataforma?'
  ];

  if (userRespostas.length < perguntas.length) {
    msg.reply(perguntas[userRespostas.length]);
  } else {
    respostas.delete(msg.author.id);

    let canal = msg.guild.channels.cache.find(c => c.name === 'recrutamento-aprovacao');
    if (!canal) {
      canal = await msg.guild.channels.create({ name: 'recrutamento-aprovacao' });
    }

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('📩 Nova aplicação')
      .setDescription(`
👤 ${msg.author}

Nick: ${userRespostas[0]}
Idade: ${userRespostas[1]}
Bounty: ${userRespostas[2]}
Plataforma: ${userRespostas[3]}
`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('aprovar').setLabel('✅ Aprovar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('recusar').setLabel('❌ Recusar').setStyle(ButtonStyle.Danger)
    );

    canal.send({ content: msg.author.id, embeds: [embed], components: [row] });

    msg.reply('✅ Aplicação enviada!');
  }
});

client.login(process.env.DISCORD_TOKEN);
