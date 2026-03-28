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

  // ===== PAINEL =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content !== '!painel') return;

    const embed = new EmbedBuilder()
      .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')
      .setDescription(
`**Como funciona:**
1️⃣ Selecione o evento abaixo  
2️⃣ Um tópico privado será criado  
3️⃣ Envie sua prova lá  
4️⃣ Aguarde a staff aprovar  

📸 **Prova obrigatória:** imagem ou vídeo`
      )
      .setColor('#2b2d31');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select_evento')
      .setPlaceholder('📌 Escolha o evento')
      .addOptions([
        { label: '🐉 Leviathan', description: '3 pontos', value: '3_leviathan' },
        { label: '🦈 Terroshark', description: '1 ponto', value: '1_terro' },
        { label: '🌊 Sea Beast', description: '1 ponto', value: '1_sea' },
        { label: '🌋 Vulcão', description: '2 pontos', value: '2_vulcao' },
        { label: '👻 Navio Fantasma', description: '1 ponto', value: '1_navio' },
        { label: '⚔️ Raids', description: '1 ponto', value: '1_raids' }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  });

  // ===== MENU =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_evento') return;

    try {
      await interaction.deferReply({ ephemeral: true });

      const [pontos] = interaction.values[0].split('_');

      // ===== CRIA THREAD PRIVADA =====
      const thread = await interaction.channel.threads.create({
        name: `evento-${interaction.user.username}`,
        autoArchiveDuration: 1440,
        type: ChannelType.PrivateThread,
        reason: 'Registro de evento'
      });

      // adiciona usuário
      await thread.members.add(interaction.user.id).catch(() => {});

      // adiciona TODOS staff automaticamente
      const staffRole = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Moderador Staff');
      if (staffRole) {
        staffRole.members.forEach(member => {
          thread.members.add(member.id).catch(() => {});
        });
      }

      // ===== BOTÕES =====
      const buttons = new ActionRowBuilder().addComponents(
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
        content: `📸 ${interaction.user}, envie sua prova aqui.`,
        components: [buttons]
      });

      await interaction.editReply({
        content: `✅ Seu evento foi criado: ${thread}`
      });

    } catch (err) {
      console.log('ERRO MENU:', err);
    }
  });

  // ===== BOTÕES =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (
      !interaction.customId.startsWith('aprovar') &&
      !interaction.customId.startsWith('recusar')
    ) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      const staffRole = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Moderador Staff');

      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        return interaction.editReply({
          content: '❌ Apenas staff pode usar isso.'
        });
      }

      const thread = interaction.channel;

      // ===== RECUSAR =====
      if (interaction.customId.startsWith('recusar')) {
        await interaction.editReply('❌ Evento recusado.');

        setTimeout(async () => {
          await thread.delete().catch(() => {});
        }, 2000);
      }

      // ===== APROVAR =====
      if (interaction.customId.startsWith('aprovar')) {

        const partes = interaction.customId.split('_');
        const userId = partes[1];
        const pontos = parseInt(partes[2]);

        let db = {};
        if (fs.existsSync('./level.json')) {
          db = JSON.parse(fs.readFileSync('./level.json'));
        }

        if (!db[userId]) {
          db[userId] = { mensagens: 0, level: 0 };
        }

        db[userId].mensagens += pontos;

        fs.writeFileSync('./level.json', JSON.stringify(db, null, 2));

        // ranking
        const ranking = Object.entries(db)
          .map(([id, data]) => ({
            id,
            pontos: data.mensagens
          }))
          .sort((a, b) => b.pontos - a.pontos)
          .slice(0, 10);

        fs.writeFileSync('./ranking.json', JSON.stringify(ranking, null, 2));

        await interaction.editReply(`✅ Evento aprovado (+${pontos} pontos)`);

        setTimeout(async () => {
          await thread.delete().catch(() => {});
        }, 2000);
      }

    } catch (err) {
      console.log('ERRO BOTÃO:', err);
    }
  });

};
