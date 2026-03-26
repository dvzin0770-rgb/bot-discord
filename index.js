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

// ATIVA RECRUTAMENTO
recrutamento(client);

// QUANDO LIGAR
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

// ================= COMANDOS (!)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();

  // TESTE
  if (cmd === 'ping') {
    return message.reply('🏓 Pong!');
  }

  // ===== PAINEL SUPORTE =====
  if (cmd === 'ticket') {

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎫 Central de Suporte')
      .setDescription('Precisa de ajuda? Abra um ticket abaixo!')
      .addFields(
        { name: '📋 Como funciona?', value: 'Clique no botão para abrir um ticket.' },
        { name: '🔒 Privacidade', value: 'Apenas você e a staff podem ver.' }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== PAINEL RECRUTAMENTO =====
  if (cmd === 'recrutamento') {
    recrutamento.enviarPainel(message.channel);
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

});

client.login(process.env.DISCORD_TOKEN);
