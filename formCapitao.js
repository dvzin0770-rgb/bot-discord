// ======================================================
// 👑 FORM CAPITÃO ULTRA (300+ LINHAS REAIS)
// ======================================================

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// ======================================================
// ⚙️ CONFIG
// ======================================================

const STAFF_ROLE = 'Moderador Staff';
const CAP_ROLE = '⃤⃟⃝ Capitão';
const PREFIX_THREAD = 'capitao-';
const COOLDOWN = 5 * 60 * 1000;

// ======================================================
// 🧠 CACHE
// ======================================================

const cache = new Map();
const cooldown = new Map();

// ======================================================
// 🔧 FUNÇÕES AUX
// ======================================================

function getRole(guild, name) {
  return guild.roles.cache.find(r => r.name === name);
}

function emCooldown(id) {
  return cooldown.has(id) && Date.now() < cooldown.get(id);
}

function setCooldown(id) {
  cooldown.set(id, Date.now() + COOLDOWN);
}

function criarPainel() {
  return new EmbedBuilder()
    .setColor('#6366f1')
    .setTitle('👑 RECRUTAMENTO — CAPITÃO FROSTVOW')
    .setDescription(
      '🔥 **Quer liderar a Frostvow?**\n\n' +
      'Preencha o formulário completo.\n' +
      'A staff irá analisar sua aplicação.\n\n' +
      '⚠️ Responda tudo com atenção.'
    )
    .setFooter({ text: 'Sistema oficial Frostvow' });
}

function criarBotao() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_form_capitao')
      .setLabel('👑 Aplicar para Capitão')
      .setStyle(ButtonStyle.Success)
  );
}

function criarBotoesStaff() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('aprovar_capitao')
      .setLabel('✅ Aprovar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('recusar_capitao')
      .setLabel('❌ Recusar')
      .setStyle(ButtonStyle.Danger)
  );
}

// ======================================================
// 📌 COMANDO
// ======================================================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  if (message.content === '!formcapitao') {

    await message.channel.send({
      embeds: [criarPainel()],
      components: [criarBotao()]
    });

  }

});

// ======================================================
// 🔘 INTERAÇÕES
// ======================================================

client.on('interactionCreate', async (interaction) => {

  // ================= BOTÃO ABRIR =================
  if (interaction.isButton() && interaction.customId === 'abrir_form_capitao') {

    if (emCooldown(interaction.user.id)) {
      return interaction.reply({ content: '⏳ Aguarde antes de aplicar novamente.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('form_parte1')
      .setTitle('👑 Formulário (1/2)');

    const campos = [
      ['nome', 'Nome no jogo'],
      ['idade', 'Idade'],
      ['bounty', 'Bounty'],
      ['tempo', 'Tempo jogando'],
      ['cap', 'Já foi capitão?']
    ];

    for (const c of campos) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(c[0])
            .setLabel(c[1])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    return interaction.showModal(modal);
  }

  // ================= MODAL 1 =================
  if (interaction.isModalSubmit() && interaction.customId === 'form_parte1') {

    const dados = {
      nome: interaction.fields.getTextInputValue('nome'),
      idade: interaction.fields.getTextInputValue('idade'),
      bounty: interaction.fields.getTextInputValue('bounty'),
      tempo: interaction.fields.getTextInputValue('tempo'),
      cap: interaction.fields.getTextInputValue('cap')
    };

    cache.set(interaction.user.id, dados);

    const modal2 = new ModalBuilder()
      .setCustomId('form_parte2')
      .setTitle('👑 Formulário (2/2)');

    const campos2 = [
      ['motivo', 'Por que quer ser capitão?'],
      ['crew', 'O que faria pela crew?'],
      ['inativos', 'Como lidaria com inativos?'],
      ['problemas', 'Já teve problemas com staff?'],
      ['disp', 'Disponibilidade diária']
    ];

    for (const c of campos2) {
      modal2.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(c[0])
            .setLabel(c[1])
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
    }

    return interaction.showModal(modal2);
  }

  // ================= MODAL 2 =================
  if (interaction.isModalSubmit() && interaction.customId === 'form_parte2') {

    const p1 = cache.get(interaction.user.id);

    if (!p1) {
      return interaction.reply({ content: '❌ Erro interno.', ephemeral: true });
    }

    const p2 = {
      motivo: interaction.fields.getTextInputValue('motivo'),
      crew: interaction.fields.getTextInputValue('crew'),
      inativos: interaction.fields.getTextInputValue('inativos'),
      problemas: interaction.fields.getTextInputValue('problemas'),
      disp: interaction.fields.getTextInputValue('disp')
    };

    const thread = await interaction.channel.threads.create({
      name: `${PREFIX_THREAD}${interaction.user.id}`,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    await thread.members.add(interaction.user.id);

    const staffRole = getRole(interaction.guild, STAFF_ROLE);

    if (staffRole) {
      for (const m of staffRole.members.values()) {
        await thread.members.add(m.id).catch(() => {});
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('📋 Aplicação de Capitão')
      .setDescription(`👤 <@${interaction.user.id}>`)
      .addFields(
        { name: 'Nome', value: p1.nome },
        { name: 'Idade', value: p1.idade },
        { name: 'Bounty', value: p1.bounty },
        { name: 'Tempo', value: p1.tempo },
        { name: 'Já foi capitão', value: p1.cap },
        { name: 'Motivo', value: p2.motivo },
        { name: 'Crew', value: p2.crew },
        { name: 'Inativos', value: p2.inativos },
        { name: 'Problemas', value: p2.problemas },
        { name: 'Disponibilidade', value: p2.disp }
      );

    await thread.send({
      embeds: [embed],
      components: [criarBotoesStaff()]
    });

    cache.delete(interaction.user.id);
    setCooldown(interaction.user.id);

    await interaction.reply({
      content: '✅ Aplicação enviada!',
      ephemeral: true
    });

  }

  // ================= STAFF =================
  if (interaction.isButton()) {

    if (!['aprovar_capitao', 'recusar_capitao'].includes(interaction.customId)) return;

    await interaction.deferReply({ ephemeral: true });

    const staffRole = getRole(interaction.guild, STAFF_ROLE);

    if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
      return interaction.editReply('❌ Apenas staff.');
    }

    const thread = interaction.channel;
    const userId = thread.name.replace(PREFIX_THREAD, '');

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const capRole = getRole(interaction.guild, CAP_ROLE);

    if (interaction.customId === 'aprovar_capitao') {

      if (member && capRole) {
        await member.roles.add(capRole).catch(() => {});
      }

      eco.addMoney(userId, 5000);

      if (member) {
        await member.send('✅ Você foi aprovado como Capitão!').catch(()=>{});
      }

      await interaction.editReply('✅ Aprovado.');

    }

    if (interaction.customId === 'recusar_capitao') {

      eco.removeMoney(userId, 1000);

      if (member) {
        await member.send('❌ Sua aplicação foi recusada.').catch(()=>{});
      }

      await interaction.editReply('❌ Recusado.');

    }

    setTimeout(() => {
      thread.delete().catch(()=>{});
    }, 4000);

  }

});

};
