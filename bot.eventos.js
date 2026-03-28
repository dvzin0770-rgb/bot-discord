const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = (client) => {

  // ===== PAINEL =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

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

  // ===== CRIAR EVENTO =====
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('aprovar_evento')
          .setLabel('✅ Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId('recusar_evento')
          .setLabel('❌ Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      await thread.send({
        content: `🎈 ${interaction.user} envie uma prova do seu evento 📸`,
        components: [row]
      });

      await interaction.reply({
        content: `✅ Seu evento foi criado: ${thread}`,
        ephemeral: true
      });
    }
  });

  // ===== APROVAR / RECUSAR =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const cargoStaff = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Moderador Staff');

    if (!cargoStaff || !interaction.member.roles.cache.has(cargoStaff.id)) {
      return interaction.reply({ content: '❌ Apenas staff pode usar isso.', ephemeral: true });
    }

    const thread = interaction.channel;

    if (interaction.customId === 'recusar_evento') {
      await interaction.reply('❌ Evento recusado.');
      setTimeout(() => thread.delete(), 3000);
    }

    if (interaction.customId === 'aprovar_evento') {
      await interaction.reply('✅ Evento aprovado! (+1 ponto)');
      setTimeout(() => thread.delete(), 3000);
    }
  });

};
