const recrutamento = require('./recrutamento');

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ativa recrutamento separado
recrutamento(client);

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
        { name: '📋 Como funciona?', value: 'Clique no botão abaixo para criar um canal privado.' },
        { name: '⏱️ Tempo', value: 'Respondemos o mais rápido possível.' },
        { name: '🔒 Privacidade', value: 'Apenas você e a staff podem ver.' }
      )
      .setFooter({ text: 'Abra apenas se necessário' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await suporte.send({ embeds: [embed], components: [row] });
  }

  // ===== RECRUTAMENTO PAINEL =====
  const canalRec = client.channels.cache.find(c =>
    c.name === '📜丨recrutamento' || c.name === 'recrutamento'
  );

  if (canalRec) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚓ Recrutamento da Tripulação')
      .setDescription('Clique abaixo para aplicar!')
      .addFields(
        { name: '📋 Requisitos', value: '• Ser ativo\n• Respeitar regras' },
        { name: '⏳ Processo', value: 'Staff irá analisar sua aplicação.' }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aplicar')
        .setLabel('📩 Aplicar')
        .setStyle(ButtonStyle.Success)
    );

    await canalRec.send({ embeds: [embed], components: [row] });
  }
});

// ===== BOTÕES =====
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
      .setTitle('🎫 Ticket')
      .setDescription(`Olá ${interaction.user}, explique seu problema.`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('assumir').setLabel('👮 Assumir').setStyle(ButtonStyle.Primary)
    );

    canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
  }

  if (interaction.customId === 'fechar') {
    await interaction.reply({ content: 'Fechando...', ephemeral: true });
    setTimeout(() => interaction.channel.delete(), 3000);
  }

  if (interaction.customId === 'assumir') {
    await interaction.reply({ content: `${interaction.user} assumiu o ticket` });
  }
});

client.login(process.env.DISCORD_TOKEN);
