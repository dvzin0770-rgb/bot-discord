const fs = require('fs');

module.exports = (client) => {
  const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require('discord.js');

  const STAFF_ROLE_NAME = '⃤⃟⃝Suporte';
  const PROMO_ROLE_NAME = '⃤⃟⃝Moderador Staff';
  const LOG_CHANNEL_NAME = 'logs-tickets';
  const DB_PATH = './tickets.json';

  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));

  const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
  const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  client.once('ready', async () => {
    const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');
    if (!canal) return console.log('Canal de suporte não encontrado');

    const mensagens = await canal.messages.fetch({ limit: 10 });
    if (mensagens.some(m => m.author.id === client.user.id)) return;

    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('🎫 Central de Suporte')
      .setDescription(
        'Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!\n\n' +
        '📋 **Como funciona?**\nClique no botão abaixo para criar um canal privado.\n\n' +
        '🔒 Apenas você e a equipe poderão ver o ticket.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('abrir_ticket').setLabel('🎟️ Abrir Ticket').setStyle(ButtonStyle.Primary)
    );

    canal.send({ embeds: [embed], components: [row] });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
    const promoRole = interaction.guild.roles.cache.find(r => r.name === PROMO_ROLE_NAME);
    const logChannel = interaction.guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
    const isStaff = staffRole && interaction.member.roles.cache.has(staffRole.id);

    // ===== ABRIR =====
    if (interaction.customId === 'abrir_ticket') {
      if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

      const categoria = interaction.guild.channels.cache.find(c => c.name === '「❄️」丨SUPORTE');
      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        parent: categoria?.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
          ...(staffRole ? [{ id: staffRole.id, allow: ['ViewChannel', 'SendMessages'] }] : [])
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🎫 Ticket de Suporte')
        .setDescription(`Olá ${interaction.user}!\n\nExplique seu problema.\n\n🔒 Apenas staff pode interagir nos botões.`);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('assumir_ticket').setLabel('👮 Assumir').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('avisar_usuario').setLabel('🔔 Avisar').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('fechar_ticket').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
      );

      await canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
      return interaction.editReply({ content: `✅ Ticket criado: ${canal}` });
    }

    // ===== ASSUMIR =====
    if (interaction.customId === 'assumir_ticket') {
      if (!isStaff) return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
      if (interaction.channel.topic) return interaction.reply({ content: '❌ Ticket já assumido.', ephemeral: true });

      await interaction.channel.setTopic(interaction.user.id);

      const db = getDB();
      const id = interaction.user.id;
      db[id] = (db[id] || 0) + 1;
      saveDB(db);

      // promoção automática
      if (db[id] >= 200 && promoRole && !interaction.member.roles.cache.has(promoRole.id)) {
        await interaction.member.roles.add(promoRole);
        interaction.channel.send(`🏆 ${interaction.user} foi promovido para ${promoRole.name}!`);
      }

      // log
      if (logChannel) logChannel.send(`📊 ${interaction.user.tag} assumiu um ticket (Total: ${db[id]})`);

      return interaction.reply({ content: `👮 ${interaction.user} assumiu o ticket\n📊 Total: ${db[id]}` });
    }

    // ===== AVISAR =====
    if (interaction.customId === 'avisar_usuario') {
      if (!isStaff) return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
      await interaction.channel.send(`🔔 ${interaction.user} pediu atenção no ticket!`);
      return interaction.reply({ content: '✅ Aviso enviado!', ephemeral: true });
    }

    // ===== FECHAR =====
    if (interaction.customId === 'fechar_ticket') {
      if (!isStaff) return interaction.reply({ content: '❌ Apenas staff.', ephemeral: true });
      if (logChannel) logChannel.send(`🔒 Ticket fechado por ${interaction.user.tag}`);
      await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
    }
  });

  // ===== !tickets =====
  client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const staffRole = message.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
    const isStaff = staffRole && message.member.roles.cache.has(staffRole.id);

    if (message.content.startsWith('!tickets')) {
      const db = getDB();
      const args = message.content.split(/ +/);
      let target = message.author;

      // se mencionar alguém
      if (args[1]) {
        const member = message.mentions.users.first();
        if (!member) return message.reply('❌ Usuário não encontrado.');
        if (!isStaff) return message.reply('❌ Apenas staff pode ver tickets de outros.');
        target = member;
      }

      const total = db[target.id] || 0;
      return message.reply(`📊 Tickets de ${target}: ${total}`);
    }

    // ===== !rankstaff =====
    if (message.content === '!rankstaff') {
      if (!isStaff) return message.reply('❌ Apenas staff pode usar esse comando.');

      const db = getDB();
      const ranking = Object.entries(db).sort((a,b) => b[1]-a[1]).slice(0,10);
      if (!ranking.length) return message.reply('Ninguém assumiu tickets ainda.');

      const texto = ranking.map((user,i) => `#${i+1} <@${user[0]}> — ${user[1]} tickets`).join('\n');
      const embed = new EmbedBuilder().setColor('#2B2D31').setTitle('🏆 Ranking da Staff').setDescription(texto);
      message.channel.send({ embeds: [embed] });
    }
  });
};
