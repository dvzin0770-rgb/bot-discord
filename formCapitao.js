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

// COMANDO
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!formcapitao') {

    const embed = new EmbedBuilder()
      .setColor('#0f172a')
      .setTitle('👑 Frostvow — Capitão')
      .setDescription(
        '```diff\n+ Torne-se um Capitão da Frostvow\n```\n' +
        'Clique no botão abaixo e preencha o formulário completo.\n\n' +
        'A staff irá analisar sua aplicação.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_form')
        .setLabel('👑 Aplicar para Capitão')
        .setStyle(ButtonStyle.Success)
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// INTERAÇÕES
client.on('interactionCreate', async (i) => {

  // ABRIR MODAL
  if (i.isButton() && i.customId === 'abrir_form') {

    const modal = new ModalBuilder()
      .setCustomId('form_capitao')
      .setTitle('👑 Formulário Capitão');

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
          .setCustomId('extra')
          .setLabel('Experiência / Motivo / Disponibilidade')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return i.showModal(modal);
  }

  // ENVIAR FORM
  if (i.isModalSubmit() && i.customId === 'form_capitao') {

    const nome = i.fields.getTextInputValue('nome');
    const idade = i.fields.getTextInputValue('idade');
    const bounty = i.fields.getTextInputValue('bounty');
    const tempo = i.fields.getTextInputValue('tempo');
    const extra = i.fields.getTextInputValue('extra');

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

    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('📋 Nova Aplicação')
      .setDescription(`👤 <@${i.user.id}>`)
      .addFields(
        { name: 'Nome', value: nome },
        { name: 'Idade', value: idade },
        { name: 'Bounty', value: bounty },
        { name: 'Tempo', value: tempo },
        { name: 'Detalhes', value: extra }
      );

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

    await i.reply({ content: '✅ Aplicação enviada!', ephemeral: true });
  }

  // STAFF
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

      await i.editReply('✅ Aprovado.');
    }

    if (i.customId === 'recusar') {
      await i.editReply('❌ Recusado.');
    }

    setTimeout(() => i.channel.delete().catch(() => {}), 3000);
  }

});

};
