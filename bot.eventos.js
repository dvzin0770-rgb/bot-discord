const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const fs = require('fs');

module.exports = (client) => {

  // ===== PAINEL =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!painel') {

      console.log('COMANDO PAINEL DETECTADO'); // 👈 TESTE

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('📌 Escolha o evento para registrar')
        .addOptions([
          { label: 'Leviathan', description: '3 pontos', value: '3' },
          { label: 'Terroshark', description: '1 ponto', value: '1' },
          { label: 'Sea Beast', description: '1 ponto', value: '1' },
          { label: 'Ilha do Vulcão', description: '2 pontos', value: '2' },
          { label: 'Navio Fantasma', description: '1 ponto', value: '1' },
          { label: 'Raids', description: '1 ponto', value: '1' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.channel.send({
        content: '📊 **REGISTRO DE EVENTOS**\nSelecione abaixo:',
        components: [row]
      });
    }
  });

  // ===== SELECIONAR EVENTO =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_evento') return;

    const pontos = parseInt(interaction.values[0]);

    const thread = await interaction.channel.threads.create({
      name: `evento-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread
    });

    await thread.members.add(interaction.user.id);

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
      content: `🎈 ${interaction.user} envie uma prova do seu evento 📸`,
      components: [row]
    });

    await interaction.reply({
      content: `✅ Evento criado: ${thread}`,
      ephemeral: true
    });
  });

  // ===== APROVAR / RECUSAR =====
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
        content: '❌ Apenas staff pode usar isso.',
        ephemeral: true
      });
    }

    const thread = interaction.channel;

    if (interaction.customId.startsWith('recusar')) {
      await interaction.reply('❌ Evento recusado.');
      setTimeout(() => thread.delete(), 3000);
    }

    if (interaction.customId.startsWith('aprovar')) {

      const partes = interaction.customId.split('_');
      const userId = partes[1];
      const pontos = parseInt(partes[2]);

      const db = JSON.parse(fs.readFileSync('./level.json'));

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

      await interaction.reply(`✅ Evento aprovado! (+${pontos} pontos)`);

      setTimeout(() => thread.delete(), 3000);
    }
  });

};
