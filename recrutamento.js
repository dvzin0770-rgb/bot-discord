const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = (client) => {

  // ===== ENVIAR PAINEL =====
  module.exports.enviarPainel = async (channel) => {

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚓ Recrutamento da Tripulação')
      .setDescription(
        'Quer fazer parte da nossa tripulação?\nClique no botão abaixo e preencha o formulário!\n\n' +
        '📋 **Requisitos**\n' +
        '• Ser ativo\n' +
        '• Ter bom comportamento\n' +
        '• Seguir as regras do servidor\n\n' +
        '⏳ **Processo**\n' +
        'Sua candidatura será analisada pela staff e você receberá uma resposta em breve.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aplicar')
        .setLabel('📩 Aplicar')
        .setStyle(ButtonStyle.Success)
    );

    channel.send({ embeds: [embed], components: [row] });
  };

  // ===== INTERAÇÕES =====
  client.on('interactionCreate', async (interaction) => {

    // BOTÃO APLICAR
    if (interaction.isButton() && interaction.customId === 'aplicar') {

      const modal = new ModalBuilder()
        .setCustomId('form_recrutamento')
        .setTitle('📋 Formulário');

      const nick = new TextInputBuilder()
        .setCustomId('nick')
        .setLabel('Qual seu nick?')
        .setStyle(TextInputStyle.Short);

      const idade = new TextInputBuilder()
        .setCustomId('idade')
        .setLabel('Qual sua idade?')
        .setStyle(TextInputStyle.Short);

      const bounty = new TextInputBuilder()
        .setCustomId('bounty')
        .setLabel('Quanto de bounty você tem?')
        .setStyle(TextInputStyle.Short);

      const plataforma = new TextInputBuilder()
        .setCustomId('plataforma')
        .setLabel('Joga em qual plataforma?')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nick),
        new ActionRowBuilder().addComponents(idade),
        new ActionRowBuilder().addComponents(bounty),
        new ActionRowBuilder().addComponents(plataforma)
      );

      return interaction.showModal(modal);
    }

    // RESPOSTA DO FORM
    if (interaction.isModalSubmit() && interaction.customId === 'form_recrutamento') {

      const nick = interaction.fields.getTextInputValue('nick');
      const idade = interaction.fields.getTextInputValue('idade');
      const bounty = interaction.fields.getTextInputValue('bounty');
      const plataforma = interaction.fields.getTextInputValue('plataforma');

      let canal = interaction.guild.channels.cache.find(c => c.name === 'recrutamento-aprovacao');

      if (!canal) {
        canal = await interaction.guild.channels.create({
          name: 'recrutamento-aprovacao',
          type: 0
        });
      }

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('📩 Nova Aplicação')
        .setDescription(`👤 ${interaction.user}`)
        .addFields(
          { name: 'Nick', value: nick },
          { name: 'Idade', value: idade },
          { name: 'Bounty', value: bounty },
          { name: 'Plataforma', value: plataforma }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aprovar_${interaction.user.id}`)
          .setLabel('✅ Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`recusar_${interaction.user.id}`)
          .setLabel('❌ Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      canal.send({ embeds: [embed], components: [row] });

      await interaction.reply({ content: '✅ Aplicação enviada!', ephemeral: true });
    }

    // APROVAR
    if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {

      const userId = interaction.customId.split('_')[1];
      const membro = await interaction.guild.members.fetch(userId);

      let cargo = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Membros da crew');

      if (!cargo) {
        cargo = await interaction.guild.roles.create({
          name: '⃤⃟⃝Membros da crew'
        });
      }

      await membro.roles.add(cargo);

      await membro.send('🎉 Você foi aprovado na tripulação!');

      await interaction.reply({ content: '✅ Aprovado e cargo entregue!' });
    }

    // RECUSAR
    if (interaction.isButton() && interaction.customId.startsWith('recusar_')) {

      const userId = interaction.customId.split('_')[1];
      const membro = await interaction.guild.members.fetch(userId);

      await membro.send('❌ Você foi recusado.');

      await interaction.reply({ content: '❌ Recrutamento recusado' });
    }

  });

};
