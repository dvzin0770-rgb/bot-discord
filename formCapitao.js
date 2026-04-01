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

// CONFIG
const STAFF_ROLE = 'Moderador Staff';
const CAP_ROLE = '⃤⃟⃝ Capitão';
const PREFIX = 'cap-';

// ================= PAINEL =================
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!formcapitao') {

    const embed = new EmbedBuilder()
      .setColor('#0ea5e9')
      .setTitle('👑┃CAPITÃO — FROSTVOW')
      .setDescription(
`🌊 **Quer liderar a Frostvow?**

Antes de aplicar, leia com atenção:

⚠️ **REQUISITOS OBRIGATÓRIOS**
• Ter **+10 DIAS na tripulação**
• Ser ativo
• Ter responsabilidade

❌ Caso não cumpra, sua aplicação será recusada.

📋 Clique no botão abaixo para iniciar sua candidatura.`
      )
      .setFooter({ text: 'Frostvow System' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_form')
        .setLabel('👑 Candidatar-se')
        .setStyle(ButtonStyle.Success)
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= INTERAÇÕES =================
client.on('interactionCreate', async (i) => {

  // ===== ABRIR MODAL =====
  if (i.isButton() && i.customId === 'abrir_form') {

    const modal = new ModalBuilder()
      .setCustomId('form_capitao')
      .setTitle('👑 Aplicação Capitão');

    modal.addComponents(

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome')
          .setLabel('Nome no jogo')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('idade')
          .setLabel('Idade')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bounty')
          .setLabel('Bounty')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('tempo')
          .setLabel('Tempo jogando')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('cap')
          .setLabel('Já foi capitão?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return i.showModal(modal);
  }

  // ===== ENVIO DO FORM =====
  if (i.isModalSubmit() && i.customId === 'form_capitao') {

    const dados = {
      nome: i.fields.getTextInputValue('nome'),
      idade: i.fields.getTextInputValue('idade'),
      bounty: i.fields.getTextInputValue('bounty'),
      tempo: i.fields.getTextInputValue('tempo'),
      cap: i.fields.getTextInputValue('cap')
    };

    const thread = await i.channel.threads.create({
      name: `${PREFIX}${i.user.id}`,
      type: ChannelType.PrivateThread
    });

    await thread.members.add(client.user.id);
    await thread.members.add(i.user.id);

    const staff = i.guild.roles.cache.find(r => r.name === STAFF_ROLE);
    if (staff) {
      for (const m of staff.members.values()) {
        await thread.members.add(m.id).catch(() => {});
      }
    }

    // ===== EMBED =====
    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('📋┃NOVA APLICAÇÃO — CAPITÃO')
      .setDescription(`👤 <@${i.user.id}>`)
      .addFields(
        { name: 'Nome', value: dados.nome },
        { name: 'Idade', value: dados.idade },
        { name: 'Bounty', value: dados.bounty },
        { name: 'Tempo jogando', value: dados.tempo },
        { name: 'Já foi capitão?', value: dados.cap }
      );

    // ===== BOTÕES =====
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aprovar')
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('recusar')
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({ embeds: [embed], components: [row] });

    // ===== PERGUNTAS NO TÓPICO =====
    await thread.send({
      content:
`📌 **RESPONDA NO CHAT ABAIXO:**

1. Por que quer ser capitão?
2. O que faria pela crew?
3. Como lidaria com membros inativos?
4. Já teve problemas com staff?
5. Qual sua disponibilidade diária?

✍️ Responda tudo com calma.`
    });

    await i.reply({ content: '✅ Aplicação criada! Continue no tópico.', ephemeral: true });
  }

  // ===== APROVAR / RECUSAR =====
  if (i.isButton() && (i.customId === 'aprovar' || i.customId === 'recusar')) {

    await i.deferReply({ ephemeral: true });

    const staff = i.guild.roles.cache.find(r => r.name === STAFF_ROLE);
    if (!staff || !i.member.roles.cache.has(staff.id)) {
      return i.editReply('❌ Apenas staff.');
    }

    const userId = i.channel.name.replace(PREFIX, '');
    const member = await i.guild.members.fetch(userId).catch(() => null);
    const capRole = i.guild.roles.cache.find(r => r.name === CAP_ROLE);

    if (i.customId === 'aprovar') {

      if (member && capRole) {
        await member.roles.add(capRole).catch(() => {});
      }

      eco.addMoney(userId, 5000);

      await i.editReply('✅ Aprovado e cargo entregue.');
    }

    if (i.customId === 'recusar') {
      await i.editReply('❌ Aplicação recusada.');
    }

    setTimeout(() => i.channel.delete().catch(() => {}), 4000);
  }

});

};
