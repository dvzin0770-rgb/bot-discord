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

// ATIVAR SISTEMAS
comandos(client);
recrutamento(client);
staff(client);

// BOT ONLINE
client.once('ready', async () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);

  // ===== PAINEL SUPORTE =====
  const suporte = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

  if (suporte) {
    const msgs = await suporte.messages.fetch({ limit: 10 });
    const jaExiste = msgs.find(m => m.author.id === client.user.id);

    if (!jaExiste) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎫 Central de Suporte')
        .setDescription(
          'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
          '📋 **Como funciona?**\nClique no botão abaixo.\n\n' +
          '🔒 **Privado**\nApenas você e a staff.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('🎟️ Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      suporte.send({ embeds: [embed], components: [row] });
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

// ===== TICKET =====
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
        `Olá ${interaction.user}!\nExplique seu problema.\n\n🔒 Apenas você e a staff podem ver.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    canal.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Ticket criado: ${canal}`,
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
    await interaction.channel.delete();
  }

});

client.login(process.env.DISCORD_TOKEN);
