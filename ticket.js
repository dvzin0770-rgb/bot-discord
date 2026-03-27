const fs = require('fs');

module.exports = (client) => {
  const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require('discord.js');

  const STAFF_ROLE_NAME = '⃤⃟⃝Suporte';
  const DB_PATH = './tickets.json';

  // cria banco se não existir
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }

  function getDB() {
    return JSON.parse(fs.readFileSync(DB_PATH));
  }

  function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  client.once('ready', async () => {
    const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

    if (!canal) return console.log('Canal de suporte não encontrado');

    const mensagens = await canal.messages.fetch({ limit: 10 });
    const jaTem = mensagens.some(m => m.author.id === client.user.id);

    if (jaTem) return;

    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Central de Suporte')
      .setDescription(
        'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
        '📋 **Como funciona?**\nClique no botão abaixo para criar um canal privado.\n\n' +
        '🔒 Apenas você e a equipe poderão ver o ticket.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_ticket')
        .setLabel('🎟️ Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    canal.send({ embeds: [embed], components: [row] });
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      const staffRole = interaction.guild.roles.cache.find(
        r => r.name === STAFF_ROLE_NAME
      );

      const isStaff = staffRole && interaction.member.roles.cache.has(staffRole.id);

      // ===== ABRIR =====
      if (interaction.customId === 'abrir_ticket') {

        await interaction.deferReply({ ephemeral: true });

        const categoria = interaction.guild.channels.cache.find(
          c => c.name === '「❄️」丨SUPORTE'
        );

        const canal = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0,
          parent: categoria?.id,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: ['ViewChannel'] },
            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
            ...(staffRole ? [{
              id: staffRole.id,
              allow: ['ViewChannel', 'SendMessages']
            }] : [])
          ]
        });

        const embed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setTitle('🎫 Ticket de Suporte')
          .setDescription(
            `Olá ${interaction.user}!\n\nExplique seu problema.\n\n🔒 Apenas staff pode interagir nos botões.`
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('assumir_ticket').setLabel('👮 Assumir').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('avisar_usuario').setLabel('🔔 Avisar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('fechar_ticket').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
        );

        await canal.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [row]
        });

        return interaction.editReply({ content: `✅ Ticket criado: ${canal}` });
      }

      // ===== ASSUMIR =====
      if (interaction.customId === 'assumir_ticket') {

        if (!isStaff) {
          return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
        }

        const topic = interaction.channel.topic;

        // já assumido
        if (topic) {
          return interaction.reply({
            content: '❌ Esse ticket já foi assumido.',
            ephemeral: true
          });
        }

        // marca quem assumiu
        await interaction.channel.setTopic(interaction.user.id);

        // salva no banco
        const db = getDB();
        const id = interaction.user.id;

        db[id] = (db[id] || 0) + 1;
        saveDB(db);

        return interaction.reply({
          content: `👮 ${interaction.user} assumiu este ticket.\n📊 Total: ${db[id]} tickets`
        });
      }

      // ===== AVISAR =====
      if (interaction.customId === 'avisar_usuario') {

        if (!isStaff) {
          return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
        }

        await interaction.channel.send(`🔔 ${interaction.user} pediu atenção!`);

        return interaction.reply({ content: 'Aviso enviado!', ephemeral: true });
      }

      // ===== FECHAR =====
      if (interaction.customId === 'fechar_ticket') {

        if (!isStaff) {
          return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
        }

        await interaction.reply({ content: '🔒 Fechando...', ephemeral: true });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 2000);
      }

    } catch (err) {
      console.error(err);
    }
  });

  // ===== COMANDO !tickets =====
  client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === '!tickets') {
      const db = getDB();
      const id = message.author.id;

      const total = db[id] || 0;

      message.reply(`👮 ${message.author}\n📊 Tickets assumidos: ${total}`);
    }
  });

};
