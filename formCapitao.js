const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = (client) => {

// ============================== // ⚙️ CONFIG // ============================== const STAFF_ROLE = 'Moderador Staff'; const NOME_THREAD = 'capitao-';

// ============================== // 📌 COMANDO PAINEL // ============================== client.on('messageCreate', async (message) => {

if (message.author.bot) return;

if (message.content === '!formcapitao') {

  const embed = new EmbedBuilder()
    .setColor('#6366f1')
    .setTitle('👑 RECRUTAMENTO — CAPITÃO FROSTVOW')
    .setDescription(
      'Quer liderar a Frostvow?\n\n' +
      'Preencha o formulário completo clicando no botão abaixo.\n' +
      'A staff irá analisar sua aplicação cuidadosamente.'
    )
    .setFooter({ text: 'Sistema oficial Frostvow' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_form_capitao')
      .setLabel('👑 Candidatar-se a Capitão')
      .setStyle(ButtonStyle.Primary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
}

});

// ============================== // 🧠 INTERAÇÕES // ============================== client.on('interactionCreate', async (interaction) => {

// ==============================
// 📋 ABRIR MODAL
// ==============================
if (interaction.isButton()) {

  if (interaction.customId === 'abrir_form_capitao') {

    const modal = new ModalBuilder()
      .setCustomId('form_parte1')
      .setTitle('👑 Formulário Capitão (1/2)');

    const nome = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome no jogo')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const idade = new TextInputBuilder()
      .setCustomId('idade')
      .setLabel('Idade')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const bounty = new TextInputBuilder()
      .setCustomId('bounty')
      .setLabel('Bounty')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const tempo = new TextInputBuilder()
      .setCustomId('tempo')
      .setLabel('Tempo jogando')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const cap = new TextInputBuilder()
      .setCustomId('capitao')
      .setLabel('Já foi capitão antes?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(idade),
      new ActionRowBuilder().addComponents(bounty),
      new ActionRowBuilder().addComponents(tempo),
      new ActionRowBuilder().addComponents(cap)
    );

    await interaction.showModal(modal);
  }
}

// ==============================
// 📥 PARTE 1
// ==============================
if (interaction.isModalSubmit()) {

  if (interaction.customId === 'form_parte1') {

    const dados = {
      nome: interaction.fields.getTextInputValue('nome'),
      idade: interaction.fields.getTextInputValue('idade'),
      bounty: interaction.fields.getTextInputValue('bounty'),
      tempo: interaction.fields.getTextInputValue('tempo'),
      cap: interaction.fields.getTextInputValue('capitao')
    };

    const modal2 = new ModalBuilder()
      .setCustomId(`form_parte2_${interaction.user.id}`)
      .setTitle('👑 Formulário Capitão (2/2)');

    const motivo = new TextInputBuilder()
      .setCustomId('motivo')
      .setLabel('Por que quer ser capitão?')
      .setStyle(TextInputStyle.Paragraph);

    const crew = new TextInputBuilder()
      .setCustomId('crew')
      .setLabel('O que faria pela crew?')
      .setStyle(TextInputStyle.Paragraph);

    const inativos = new TextInputBuilder()
      .setCustomId('inativos')
      .setLabel('Como lidaria com inativos?')
      .setStyle(TextInputStyle.Paragraph);

    const problemas = new TextInputBuilder()
      .setCustomId('problemas')
      .setLabel('Já teve problemas com staff?')
      .setStyle(TextInputStyle.Paragraph);

    const disponibilidade = new TextInputBuilder()
      .setCustomId('disp')
      .setLabel('Disponibilidade diária')
      .setStyle(TextInputStyle.Short);

    modal2.addComponents(
      new ActionRowBuilder().addComponents(motivo),
      new ActionRowBuilder().addComponents(crew),
      new ActionRowBuilder().addComponents(inativos),
      new ActionRowBuilder().addComponents(problemas),
      new ActionRowBuilder().addComponents(disponibilidade)
    );

    // salva temporário
    client.tempForm = client.tempForm || new Map();
    client.tempForm.set(interaction.user.id, dados);

    await interaction.showModal(modal2);
  }

  // ==============================
  // 📥 PARTE 2
  // ==============================
  if (interaction.customId.startsWith('form_parte2_')) {

    const userId = interaction.user.id;
    const parte1 = client.tempForm.get(userId);

    if (!parte1) {
      return interaction.reply({ content: 'Erro no formulário.', ephemeral: true });
    }

    const parte2 = {
      motivo: interaction.fields.getTextInputValue('motivo'),
      crew: interaction.fields.getTextInputValue('crew'),
      inativos: interaction.fields.getTextInputValue('inativos'),
      problemas: interaction.fields.getTextInputValue('problemas'),
      disp: interaction.fields.getTextInputValue('disp')
    };

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

    const thread = await interaction.channel.threads.create({
      name: `${NOME_THREAD}${interaction.user.username}`,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    await thread.members.add(userId);

    if (staffRole) {
      for (const m of staffRole.members.values()) {
        await thread.members.add(m.id).catch(() => {});
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('📋 APLICAÇÃO COMPLETA — CAPITÃO')
      .setDescription(`👤 ${interaction.user}`)
      .addFields(
        { name: 'Nome', value: parte1.nome },
        { name: 'Idade', value: parte1.idade },
        { name: 'Bounty', value: parte1.bounty },
        { name: 'Tempo', value: parte1.tempo },
        { name: 'Já foi capitão', value: parte1.cap },
        { name: 'Motivo', value: parte2.motivo },
        { name: 'Crew', value: parte2.crew },
        { name: 'Inativos', value: parte2.inativos },
        { name: 'Problemas', value: parte2.problemas },
        { name: 'Disponibilidade', value: parte2.disp }
      );

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aprovar_cap')
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('recusar_cap')
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({ embeds: [embed], components: [botoes] });

    client.tempForm.delete(userId);

    await interaction.reply({
      content: '✅ Aplicação enviada com sucesso!',
      ephemeral: true
    });
  }
}

// ==============================
// 🎯 APROVAR / RECUSAR
// ==============================
if (interaction.isButton()) {

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

  if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
    return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
  }

  if (interaction.customId === 'aprovar_cap') {
    await interaction.reply('✅ Aplicação aprovada!');
  }

  if (interaction.customId === 'recusar_cap') {
    await interaction.reply('❌ Aplicação recusada!');
  }

}

});

};
