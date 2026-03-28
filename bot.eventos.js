const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder
} = require('discord.js');

console.log("✅ bot.eventos.js carregado");

module.exports = (client) => {

  const STAFF_ROLE_NAME = "Moderador Staff";

  // ===== PAINEL =====
  client.on('messageCreate', async (message) => {

    console.log("📩 MSG RECEBIDA:", message.content);

    if (message.author.bot) return;
    if (!message.guild) return;

    // 🔥 FALTAVA ISSO AQUI
    if (message.content.toLowerCase() !== '!painel') return;

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')
      .setDescription(`1️⃣ Selecione o evento
2️⃣ Envie a prova no tópico
3️⃣ Aguarde aprovação da staff

📸 Prova obrigatória`);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('evento_menu')
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

    console.log("✅ Painel enviado");
  });

  // ===== INTERAÇÕES =====
  client.on('interactionCreate', async (interaction) => {

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== 'evento_menu') return;

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

      await thread.members.add(membro.id);

      if (staffRole) {
        for (const m of staffRole.members.values()) {
          await thread.members.add(m.id).catch(() => {});
        }
      }

      await thread.setArchived(false);
      await thread.setLocked(false);

      const botoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`evento_aprovar_${membro.id}_${pontos}`)
          .setLabel('✅ Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`evento_recusar_${membro.id}`)
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

    if (interaction.isButton()) {

      if (
        !interaction.customId.startsWith('evento_aprovar') &&
        !interaction.customId.startsWith('evento_recusar')
      ) return;

      const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        return interaction.reply({
          content: '❌ Apenas staff pode usar isso.',
          ephemeral: true
        });
      }

      const thread = interaction.channel;

      if (interaction.customId.startsWith('evento_recusar')) {
        await interaction.reply('❌ Evento recusado.');
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }

      if (interaction.customId.startsWith('evento_aprovar')) {
        const partes = interaction.customId.split('_');
        const pontos = parseInt(partes[3]);

        await interaction.reply(`✅ Evento aprovado! (+${pontos} pontos)`);
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }
    }

  });

};
