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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// carregar sistemas
comandos(client);
recrutamento(client);

// ===== BOT ONLINE =====
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== PAINEL SUPORTE =====
  const canalSuporte = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

  if (canalSuporte) {
    const mensagens = await canalSuporte.messages.fetch({ limit: 10 });
    const jaExiste = mensagens.find(m => m.author.id === client.user.id);

    if (!jaExiste) {
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🎫 Central de Suporte')
        .setDescription(
          'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
          '📋 **Como funciona?**\n' +
          'Clique no botão abaixo para criar um canal privado.\n\n' +
          '⏱️ **Tempo de resposta**\n' +
          'Respondemos o mais rápido possível.\n\n' +
          '🔒 **Privacidade**\n' +
          'Apenas você e a staff podem ver.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('🎟️ Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      canalSuporte.send({ embeds: [embed], components: [row] });
    }
  }

  // ===== PAINEL RECRUTAMENTO =====
  const canalRecrutamento = client.channels.cache.find(c => c.name === '📜丨recrutamento');

  if (canalRecrutamento) {
    const mensagens = await canalRecrutamento.messages.fetch({ limit: 10 });
    const jaExiste = mensagens.find(m => m.author.id === client.user.id);

    if (!jaExiste) {
      recrutamento.enviarPainel(canalRecrutamento);
    }
  }
});

// ===== INTERAÇÕES (TICKET) =====
client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton() && interaction.customId === 'abrir_ticket') {

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
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🎫 Suporte - Ticket')
      .setDescription(
        `Olá ${interaction.user}!\nExplique seu problema com detalhes.\n\n🔒 Apenas você e a staff podem ver.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    canal.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });
  }

  // FECHAR TICKET
  if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
    await interaction.channel.delete();
  }

});

client.login(process.env.DISCORD_TOKEN);
