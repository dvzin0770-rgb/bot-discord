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

module.exports = (client) => {

  // ==============================
  // ⚙️ CONFIG
  // ==============================
  const STAFF_ROLE = 'Moderador Staff';
  const THREAD_PREFIX = 'capitao-';

  // ==============================
  // 🧠 ARMAZENAMENTO TEMPORÁRIO
  // ==============================
  const formularios = new Map();

  // ==============================
  // 📌 COMANDO
  // ==============================
  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!formcapitao') {

      const embed = new EmbedBuilder()
        .setColor('#6366f1')
        .setTitle('👑 RECRUTAMENTO — CAPITÃO FROSTVOW')
        .setDescription(
          'Quer se tornar Capitão?\n\n' +
          'Clique no botão abaixo e preencha o formulário completo.\n' +
          'Após isso, você continuará respondendo na thread privada.'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_form_capitao')
          .setLabel('👑 Candidatar-se')
          .setStyle(ButtonStyle.Primary)
      );

      await message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }

  });

  // ==============================
  // 🔘 INTERAÇÕES
  // ==============================
  client.on('interactionCreate', async (interaction) => {

    // ==============================
    // ABRIR MODAL
    // ==============================
    if (interaction.isButton()) {

      if (interaction.customId === 'abrir_form_capitao') {

        const modal = new ModalBuilder()
          .setCustomId('form_capitao_modal')
          .setTitle('Formulário Capitão');

        modal.addComponents(

          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('nome')
              .setLabel('Nome no jogo')
              .setStyle(TextInputStyle.Short)
          ),

          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('idade')
              .setLabel('Idade')
              .setStyle(TextInputStyle.Short)
          ),

          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('bounty')
              .setLabel('Bounty')
              .setStyle(TextInputStyle.Short)
          ),

          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('tempo')
              .setLabel('Tempo jogando')
              .setStyle(TextInputStyle.Short)
          ),

          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('capitao')
              .setLabel('Já foi capitão antes?')
              .setStyle(TextInputStyle.Short)
          )
        );

        await interaction.showModal(modal);
      }

      // ==============================
      // APROVAR / RECUSAR
      // ==============================
      if (interaction.customId === 'aprovar_cap' || interaction.customId === 'recusar_cap') {

        const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
          return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
        }

        if (interaction.customId === 'aprovar_cap') {
          return interaction.reply('✅ Aplicação aprovada!');
        }

        if (interaction.customId === 'recusar_cap') {
          return interaction.reply('❌ Aplicação recusada!');
        }
      }

    }

    // ==============================
    // 📥 MODAL RESPONDIDO
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

        // cria thread
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

        await thread.send(
          `👋 ${interaction.user}\n\n` +
          `Vamos continuar seu formulário.\n\n` +
          `**Pergunta 1:**\nPor que quer ser capitão?`
        );

        await interaction.reply({
          content: '📩 Continue na thread privada!',
          ephemeral: true
        });
      }

    }

  });

  // ==============================
  // 📨 CONTINUAÇÃO VIA CHAT
  // ==============================
  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const data = formularios.get(message.author.id);
    if (!data) return;

    const thread = message.channel;
    if (!thread.isThread()) return;

    // ==============================
    // ETAPAS
    // ==============================
    if (data.etapa === 1) {
      data.respostas.motivo = message.content;
      data.etapa = 2;

      return message.reply('Pergunta 2:\nO que faria pela crew?');
    }

    if (data.etapa === 2) {
      data.respostas.crew = message.content;
      data.etapa = 3;

      return message.reply('Pergunta 3:\nComo lidaria com membros inativos?');
    }

    if (data.etapa === 3) {
      data.respostas.inativos = message.content;
      data.etapa = 4;

      return message.reply('Pergunta 4:\nJá teve problemas com staff?');
    }

    if (data.etapa === 4) {
      data.respostas.problemas = message.content;
      data.etapa = 5;

      return message.reply('Pergunta 5:\nDisponibilidade diária?');
    }

    if (data.etapa === 5) {
      data.respostas.disp = message.content;

      // ==============================
      // FINALIZAR
      // ==============================
      const embed = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('📋 APLICAÇÃO COMPLETA — CAPITÃO')
        .setDescription(`👤 ${message.author}`)
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
        new ButtonBuilder()
          .setCustomId('aprovar_cap')
          .setLabel('Aprovar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('recusar_cap')
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      await message.channel.send({
        embeds: [embed],
        components: [botoes]
      });

      formularios.delete(message.author.id);

      return message.reply('✅ Formulário finalizado!');
    }

  });

};
