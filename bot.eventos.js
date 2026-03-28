const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

module.exports = (client) => {

  const STAFF_ROLE_NAME = "Moderador Staff";

  // PAINEL
  client.on('messageCreate', async (message) => {
    if (message.content === '!painel') {

      const menu = new StringSelectMenuBuilder()
        .setCustomId('selecionar_evento')
        .setPlaceholder('Escolha o evento')
        .addOptions([
          { label: 'Sea Beast', value: 'sea_beast' },
          { label: 'Terror Shark', value: 'terror_shark' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.channel.send({
        content: `📊 REGISTRO DE EVENTOS — FROSTVOW

1️⃣ Selecione o evento
2️⃣ Envie a prova no tópico
3️⃣ Aguarde staff`,
        components: [row]
      });
    }
  });

  // INTERAÇÕES
  client.on('interactionCreate', async (interaction) => {

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'selecionar_evento') {

        const membro = interaction.member;
        const canal = interaction.channel;

        const thread = await canal.threads.create({
          name: `evento-${membro.user.username}`,
          type: ChannelType.PrivateThread,
          invitable: false
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

        await thread.send({
          content: `📸 ${membro}, envie sua prova aqui.`,
          components: [botoes]
        });

        await interaction.reply({
          content: `Tópico criado: ${thread}`,
          ephemeral: true
        });
      }
    }

    // BOTÕES
    if (interaction.isButton()) {

      const membro = interaction.member;
      const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

      if (!staffRole || !membro.roles.cache.has(staffRole.id)) {
        return interaction.reply({ content: 'Apenas staff pode usar.', ephemeral: true });
      }

      const thread = interaction.channel;

      if (interaction.customId === 'aprovar') {
        await interaction.reply('Evento aprovado!');
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }

      if (interaction.customId === 'recusar') {
        await interaction.reply('Evento recusado!');
        setTimeout(() => thread.delete().catch(() => {}), 2000);
      }
    }

  });

};
