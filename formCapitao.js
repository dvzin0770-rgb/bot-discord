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

const STAFF_ROLE = 'Moderador Staff';
const CAP_ROLE = '⃤⃟⃝ Capitão';

const cache = new Map();

// ================== PAINEL ==================
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!formcapitao') {

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('👑 CAPITÃO — FROSTVOW')
      .setDescription('Clique no botão abaixo para se candidatar.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_form')
        .setLabel('👑 Aplicar')
        .setStyle(ButtonStyle.Success)
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================== INTERAÇÕES ==================
client.on('interactionCreate', async (interaction) => {

  // ================= BOTÃO =================
  if (interaction.isButton()) {

    if (interaction.customId === 'abrir_form') {

      const modal = new ModalBuilder()
        .setCustomId('form1')
        .setTitle('👑 Formulário (1/2)');

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

      return interaction.showModal(modal);
    }

    // ================= APROVAR / RECUSAR =================
    if (interaction.customId === 'aprovar' || interaction.customId === 'recusar') {

      await interaction.deferReply({ ephemeral: true });

      const staff = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);
      if (!staff || !interaction.member.roles.cache.has(staff.id)) {
        return interaction.editReply('❌ Apenas staff.');
      }

      const thread = interaction.channel;
      const userId = thread.name.replace('cap-', '');

      const member = await interaction.guild.members.fetch(userId).catch(()=>null);
      const capRole = interaction.guild.roles.cache.find(r => r.name === CAP_ROLE);

      if (interaction.customId === 'aprovar') {

        if (member && capRole) {
          await member.roles.add(capRole).catch(()=>{});
        }

        eco.addMoney(userId, 5000);

        await interaction.editReply('✅ Aprovado!');
        setTimeout(() => thread.delete().catch(()=>{}), 3000);
      }

      if (interaction.customId === 'recusar') {

        eco.removeMoney(userId, 1000);

        await interaction.editReply('❌ Recusado!');
        setTimeout(() => thread.delete().catch(()=>{}), 3000);
      }
    }
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit()) {

    // ===== PARTE 1 =====
    if (interaction.customId === 'form1') {

      const dados = {
        nome: interaction.fields.getTextInputValue('nome'),
        idade: interaction.fields.getTextInputValue('idade'),
        bounty: interaction.fields.getTextInputValue('bounty'),
        tempo: interaction.fields.getTextInputValue('tempo'),
        cap: interaction.fields.getTextInputValue('cap')
      };

      cache.set(interaction.user.id, dados);

      const modal2 = new ModalBuilder()
        .setCustomId('form2')
        .setTitle('👑 Formulário (2/2)');

      modal2.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('motivo')
            .setLabel('Por que quer ser capitão?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('crew')
            .setLabel('O que faria pela crew?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('inativos')
            .setLabel('Como lidaria com inativos?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('problemas')
            .setLabel('Já teve problemas com staff?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('disp')
            .setLabel('Disponibilidade diária')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal2);
    }

    // ===== PARTE 2 =====
    if (interaction.customId === 'form2') {

      const p1 = cache.get(interaction.user.id);
      if (!p1) {
        return interaction.reply({ content: 'Erro.', ephemeral: true });
      }

      const p2 = {
        motivo: interaction.fields.getTextInputValue('motivo'),
        crew: interaction.fields.getTextInputValue('crew'),
        inativos: interaction.fields.getTextInputValue('inativos'),
        problemas: interaction.fields.getTextInputValue('problemas'),
        disp: interaction.fields.getTextInputValue('disp')
      };

      const thread = await interaction.channel.threads.create({
        name: `cap-${interaction.user.id}`,
        type: ChannelType.PrivateThread
      });

      await thread.members.add(interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('📋 Aplicação Capitão')
        .setDescription(`<@${interaction.user.id}>`)
        .addFields(
          { name: 'Nome', value: p1.nome },
          { name: 'Idade', value: p1.idade },
          { name: 'Bounty', value: p1.bounty },
          { name: 'Tempo', value: p1.tempo },
          { name: 'Capitão antes', value: p1.cap },
          { name: 'Motivo', value: p2.motivo },
          { name: 'Crew', value: p2.crew },
          { name: 'Inativos', value: p2.inativos },
          { name: 'Problemas', value: p2.problemas },
          { name: 'Disponibilidade', value: p2.disp }
        );

      const botoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('aprovar')
          .setLabel('Aprovar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('recusar')
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      await thread.send({ embeds: [embed], components: [botoes] });

      cache.delete(interaction.user.id);

      await interaction.reply({
        content: '✅ Aplicação enviada!',
        ephemeral: true
      });
    }
  }

});

};
