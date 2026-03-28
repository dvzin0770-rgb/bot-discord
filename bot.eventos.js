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

    if (message.content === '!painel') {

      const embed = new EmbedBuilder()
        .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')
        .setDescription(
`**Como funciona:**
1️⃣ Selecione o evento abaixo
2️⃣ Envie a prova no tópico criado
3️⃣ Aguarde aprovação da staff

📸 **Prova obrigatória:** imagem ou vídeo`
        )
        .setColor('#2b2d31');

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('📌 Escolha o evento')
        .addOptions([
          { label: '🐉 Leviathan', description: '3 pontos', value: 'leviathan' },
          { label: '🦈 Terroshark', description: '1 ponto', value: 'terroshark' },
          { label: '🌊 Sea Beast', description: '1 ponto', value: 'seabeast' },
          { label: '🌋 Ilha do Vulcão', description: '2 pontos', value: 'vulcao' },
          { label: '👻 Navio Fantasma', description: '1 ponto', value: 'navio' },
          { label: '⚔️ Raids', description: '1 ponto', value: 'raids' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }
  });

  // ===== MENU =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_evento') return;

    const mapaPontos = {
      leviathan: 3,
      terroshark: 1,
      seabeast: 1,
      vulcao: 2,
      navio: 1,
      raids: 1
    };

    const pontos = mapaPontos[interaction.values[0]];

    // pega cargo staff
    const cargoStaff = interaction.guild.roles.cache.find(
      r => r.name === '⃤⃟⃝Moderador Staff'
    );

    // ===== CRIA THREAD PRIVADA =====
    const thread = await interaction.channel.threads.create({
      name: `evento-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    // adiciona user
    await thread.members.add(interaction.user.id);

    // adiciona staff
    if (cargoStaff) {
      await thread.permissionOverwrites.create(cargoStaff.id, {
        ViewChannel: true,
        SendMessages: true
      });
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

    // 🔥 ENVIA SÓ NA THREAD (NÃO NO CANAL)
    await thread.send({
      content: `📸 ${interaction.user}, envie sua prova aqui.`,
      components: [row]
    });

    // 🔥 RESPOSTA INVISÍVEL (NÃO VAI PRO CANAL)
    await interaction.reply({
      content: `✅ Seu evento foi criado.`,
      ephemeral: true
    });
  });

  // ===== BOTÕES =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (
      !interaction.customId.startsWith('aprovar') &&
      !interaction.customId.startsWith('recusar')
    ) return;

    const cargoStaff = interaction.guild.roles.cache.find(
      r => r.name === '⃤⃟⃝Moderador Staff'
    );

    if (!interaction.member.roles.cache.has(cargoStaff?.id)) {
      return interaction.reply({
        content: '❌ Apenas staff.',
        ephemeral: true
      });
    }

    const thread = interaction.channel;

    // ===== RECUSAR =====
    if (interaction.customId.startsWith('recusar')) {
      await interaction.reply({ content: '❌ Evento recusado.', ephemeral: true });

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

      if (!db[userId]) db[userId] = { mensagens: 0, level: 0 };

      db[userId].mensagens += pontos;

      fs.writeFileSync('./level.json', JSON.stringify(db, null, 2));

      await interaction.reply({
        content: `✅ Aprovado (+${pontos})`,
        ephemeral: true
      });

      setTimeout(async () => {
        await thread.delete().catch(() => {});
      }, 2000);
    }
  });

};
