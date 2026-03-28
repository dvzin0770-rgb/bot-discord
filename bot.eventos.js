const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const fs = require('fs');

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!painel') {

      const embed = new EmbedBuilder()
        .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')
        .setDescription(
`**Como funciona:**
1️⃣ Selecione o evento abaixo
2️⃣ Envie a prova no tópico criado
3️⃣ Aguarde aprovação da staff

📸 **Prova obrigatória**: imagem ou vídeo`
        )
        .setColor('#2b2d31');

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('📌 Escolha o evento')
        .addOptions([
          { label: '🐉 Leviathan', description: 'Vale 3 pontos', value: 'leviathan_3' },
          { label: '🦈 Terroshark', description: 'Vale 1 ponto', value: 'terroshark_1' },
          { label: '🌊 Sea Beast', description: 'Vale 1 ponto', value: 'seabeast_1' },
          { label: '🌋 Ilha do Vulcão', description: 'Vale 2 pontos', value: 'vulcao_2' },
          { label: '👻 Navio Fantasma', description: 'Vale 1 ponto', value: 'navio_1' },
          { label: '⚔️ Raids', description: 'Vale 1 ponto', value: 'raids_1' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_evento') return;

    const partes = interaction.values[0].split('_');
    const pontos = parseInt(partes[1]);

    const thread = await interaction.channel.threads.create({
      name: `evento-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    await thread.members.add(interaction.user.id);

    const staffRole = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Moderador Staff');

    if (staffRole) {
      const staffMembers = interaction.guild.members.cache.filter(m => m.roles.cache.has(staffRole.id));
      for (const member of staffMembers.values()) {
        await thread.members.add(member.id).catch(() => {});
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${interaction.user.id}_${pontos}`)
        .setLabel('✅ Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel('❌ Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({
      content: `🎈 ${interaction.user} envie a prova do evento 📸`,
      components: [row]
    });

    await interaction.reply({
      content: `✅ Evento criado: ${thread}`,
      ephemeral: true
    });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (
      !interaction.customId.startsWith('aprovar') &&
      !interaction.customId.startsWith('recusar')
    ) return;

    const staffRole = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Moderador Staff');

    const isStaff =
      interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      interaction.member.roles.cache.has(staffRole?.id);

    if (!isStaff) {
      return interaction.reply({
        content: '❌ Apenas staff pode usar isso.',
        ephemeral: true
      });
    }

    const thread = interaction.channel;

    if (interaction.customId.startsWith('recusar')) {
      await interaction.reply({ content: '❌ Evento recusado.', ephemeral: false });
      setTimeout(() => thread.delete().catch(() => {}), 3000);
    }

    if (interaction.customId.startsWith('aprovar')) {

      const partes = interaction.customId.split('_');
      const userId = partes[1];
      const pontos = parseInt(partes[2]);

      let db = {};
      if (fs.existsSync('./level.json')) {
        db = JSON.parse(fs.readFileSync('./level.json'));
      }

      if (!db[userId]) db[userId] = { mensagens: 0, level: 0 };

      db[userId].mensagens += pontos;

      fs.writeFileSync('./level.json', JSON.stringify(db, null, 2));

      const rankingArray = Object.entries(db)
        .map(([id, data]) => ({
          nome: id,
          pontos: data.mensagens
        }))
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, 10);

      fs.writeFileSync('./ranking.json', JSON.stringify(rankingArray, null, 2));

      await interaction.reply({ content: `✅ Evento aprovado! (+${pontos} pontos)`, ephemeral: false });

      setTimeout(() => thread.delete().catch(() => {}), 3000);
    }
  });

};
