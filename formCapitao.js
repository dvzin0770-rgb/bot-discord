const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = (client) => {

// ============================== // ⚙️ CONFIG // ============================== const STAFF_ROLE = 'Moderador Staff'; const CAPITAO_ROLE = '⃤⃟⃝ Capitão'; const THREAD_PREFIX = 'capitao-';

// ============================== // 🧠 ARMAZENAMENTO // ============================== const formularios = new Map();

// ============================== // 📌 COMANDO // ============================== client.on('messageCreate', async (message) => {

if (message.author.bot) return;

if (message.content.toLowerCase() === '!formcapitao') {

  const embed = new EmbedBuilder()
    .setColor('#6366f1')
    .setTitle('👑 RECRUTAMENTO — CAPITÃO FROSTVOW')
    .setDescription(
      'Clique no botão abaixo para iniciar o formulário.'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_form_capitao')
      .setLabel('👑 Candidatar-se')
      .setStyle(ButtonStyle.Primary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
}

});

// ============================== // 🔘 INTERAÇÕES // ============================== client.on('interactionCreate', async (interaction) => {

if (interaction.isButton()) {

  if (interaction.customId === 'abrir_form_capitao') {

    const modal = new ModalBuilder()
      .setCustomId('form_capitao_modal')
      .setTitle('Formulário Capitão');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('nome').setLabel('Nome').setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('idade').setLabel('Idade').setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('bounty').setLabel('Bounty').setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('tempo').setLabel('Tempo jogando').setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('capitao').setLabel('Já foi capitão?').setStyle(TextInputStyle.Short)
      )
    );

    await interaction.showModal(modal);
  }

  // ==============================
  // APROVAR / RECUSAR
  // ==============================
  if (interaction.customId === 'aprovar_cap' || interaction.customId === 'recusar_cap') {

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);
    const capRole = interaction.guild.roles.cache.find(r => r.name === CAPITAO_ROLE);

    if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
      return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
    }

    const thread = interaction.channel;

    // pegar user salvo corretamente
    const userId = thread.ownerId || interaction.user.id;
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (interaction.customId === 'aprovar_cap') {

      if (member && capRole) {
        await member.roles.add(capRole).catch(() => {});
      }

      await interaction.reply('✅ Aprovado e cargo entregue!');

      setTimeout(() => thread.delete().catch(() => {}), 3000);
    }

    if (interaction.customId === 'recusar_cap') {

      await interaction.reply('❌ Recusado.');

      setTimeout(() => thread.delete().catch(() => {}), 3000);
    }

  }

}

// ==============================
// MODAL
// ==============================
if (interaction.isModalSubmit()) {

  if (interaction.customId === 'form_capitao_modal') {

    const dados = {
      nome: interaction.fields.getTextInputValue('nome'),
      idade: interaction.fields.getTextInputValue('idade'),
      bounty: interaction.fields.getTextInputValue('bounty'),
      tempo: interaction.fields.getTextInputValue('tempo'),
      cap: interaction.fields.getTextInputValue('capitao')
    };

    const thread = await interaction.channel.threads.create({
      name: `${THREAD_PREFIX}${interaction.user.username}`,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    await thread.members.add(interaction.user.id);

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

    if (staffRole) {
      for (const m of staffRole.members.values()) {
        await thread.members.add(m.id).catch(() => {});
      }
    }

    formularios.set(interaction.user.id, {
      ...dados,
      etapa: 1,
      respostas: {}
    });

    await thread.send(`Pergunta 1: Por que quer ser capitão?`);

    await interaction.reply({ content: 'Responda na thread!', ephemeral: true });
  }

}

});

// ============================== // CONTINUAÇÃO // ============================== client.on('messageCreate', async (message) => {

if (message.author.bot) return;

const data = formularios.get(message.author.id);
if (!data) return;

if (!message.channel.isThread()) return;

if (data.etapa === 1) {
  data.respostas.motivo = message.content;
  data.etapa = 2;
  return message.reply('Pergunta 2: O que faria pela crew?');
}

if (data.etapa === 2) {
  data.respostas.crew = message.content;
  data.etapa = 3;
  return message.reply('Pergunta 3: Como lidaria com inativos?');
}

if (data.etapa === 3) {
  data.respostas.inativos = message.content;
  data.etapa = 4;
  return message.reply('Pergunta 4: Já teve problemas com staff?');
}

if (data.etapa === 4) {
  data.respostas.problemas = message.content;
  data.etapa = 5;
  return message.reply('Pergunta 5: Disponibilidade diária?');
}

if (data.etapa === 5) {
  data.respostas.disp = message.content;

  const embed = new EmbedBuilder()
    .setColor('#22c55e')
    .setTitle('Aplicação Capitão')
    .addFields(
      { name: 'Nome', value: data.nome },
      { name: 'Idade', value: data.idade },
      { name: 'Bounty', value: data.bounty },
      { name: 'Tempo', value: data.tempo },
      { name: 'Já foi capitão', value: data.cap },
      { name: 'Motivo', value: data.respostas.motivo },
      { name: 'Crew', value: data.respostas.crew },
      { name: 'Inativos', value: data.respostas.inativos },
      { name: 'Problemas', value: data.respostas.problemas },
      { name: 'Disponibilidade', value: data.respostas.disp }
    );

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('aprovar_cap').setLabel('Aprovar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('recusar_cap').setLabel('Recusar').setStyle(ButtonStyle.Danger)
  );

  await message.channel.send({ embeds: [embed], components: [botoes] });

  formularios.delete(message.author.id);

  return message.reply('Finalizado!');
}

});

};
