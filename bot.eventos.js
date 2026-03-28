const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

client.on('messageCreate', async (message) => {
  if (message.content === '!painel') {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('criar_evento')
        .setLabel('🎈 Criar Evento')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      content: 'Clique para criar seu evento:',
      components: [row]
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'criar_evento') {

    const thread = await interaction.channel.threads.create({
      name: `evento-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      reason: 'Novo evento'
    });

    await thread.members.add(interaction.user.id);

    await thread.send(`🎈 ${interaction.user} envie uma prova do seu evento 📸`);

    await interaction.reply({
      content: `✅ Seu evento foi criado: ${thread}`,
      ephemeral: true
    });
  }
});
