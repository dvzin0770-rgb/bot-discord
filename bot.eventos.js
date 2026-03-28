const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder
} = require('discord.js');

module.exports = (client) => {

  const STAFF_ROLE_NAME = "Moderador Staff";

  // ===== PAINEL =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.content.toLowerCase().startsWith('!painel')) {

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')
        .setDescription(
`1️⃣ Selecione o evento
2️⃣ Envie a prova no tópico
3️⃣ Aguarde aprovação da staff

📸 Prova obrigatória`
        );

      const menu = new StringSelectMenuBuilder()
        .setCustomId('selecionar_evento')
        .setPlaceholder('Escolha o evento')
        .addOptions([
          { label: '🐉 Leviathan', value: '3' },
          { label: '🦈 Terror Shark', value: '1' },
          { label: '🌊 Sea Beast', value: '1' },
          { label: '🌋 Ilha do Vulcão', value: '2' },
          { label: '👻 Navio Fantasma', value: '1' },
          { label: '⚔️ Raids', value: '1' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }
  });

  // ===== INTERAÇÕES =====
  client.on('interactionCreate', async (interaction) => {

    // ===== MENU =====
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== 'selecionar_evento') return;

      const pontos = parseInt(interaction.values[0]);
      const membro = interaction.member;
      const canal = interaction.channel;

      await interaction.deferReply({ ephemeral: true });

      const thread = await canal.threads.create({
        name: `evento-${membro.user.username}`,
        type: ChannelType.PrivateThread,
        invitable: false,
        autoArchiveDuration: 1440
      });

      const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

      // adiciona quem criou
      await thread.members.add(membro.id);

      // adiciona staff
      if (staffRole) {
        for (const m of staffRole.members.values()) {
          await thread.members.add(m.id).catch(() => {});
        }
      }

      await thread.setLocked(false);
      await thread.setArchived(false);

      const botoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aprovar_${membro.id}_${pontos}`)
          .setLabel('✅ Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`recusar_${membro.id}`)
          .setLabel('❌ Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      await thread.send({
        content: `🎈 ${membro}, envie sua prova aqui 📸`,
        components: [botoes]
      });

      await interaction.editReply({
        content: `✅ Evento criado: ${thread}`
      });
    }

    // ===== BOTÕES =====
    if (interaction.isButton()) {

      if (
        !interaction.customId.startsWith('aprovar') &&
        !interaction.customId.startsWith('recusar')
      ) return;

      const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        return interaction.reply({
          content: '❌ Apenas staff pode usar isso.',
          ephemeral: true
        });
      }

      const thread = interaction.channel;

      // RECUSAR
      if (interaction.customId.startsWith('recusar')) {
        await interaction.reply('❌ Evento recusado.');
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }

      // APROVAR
      if (interaction.customId.startsWith('aprovar')) {
        const partes = interaction.customId.split('_');
        const pontos = parseInt(partes[2]);

        await interaction.reply(`✅ Evento aprovado! (+${pontos} pontos)`);
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }
    }

  });

};
