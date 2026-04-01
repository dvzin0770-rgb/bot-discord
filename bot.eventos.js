// ======================================================
// 🌊 SISTEMA EVENTOS DO MAR COMPLETO (250+ LINHAS)
// ======================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// ======================================================
// ⚙️ CONFIG
// ======================================================

const STAFF_ROLE = 'Moderador Staff';
const THREAD_PREFIX = 'evento-';

// ======================================================
// 🎯 EVENTOS + PONTOS + IMAGENS
// ======================================================

const eventos = {
  leviathan: {
    nome: '🐉 Leviathan',
    pontos: 3,
    img: 'https://i.imgur.com/7b1W3dP.png'
  },
  terroshark: {
    nome: '🦈 Terroshark',
    pontos: 1,
    img: 'https://i.imgur.com/3ZQ3Z9H.png'
  },
  seabest: {
    nome: '🌊 Sea Beast',
    pontos: 1,
    img: 'https://i.imgur.com/xP9XK7S.png'
  },
  vulcao: {
    nome: '🌋 Ilha do Vulcão',
    pontos: 2,
    img: 'https://i.imgur.com/yZ8kF8T.png'
  },
  fantasma: {
    nome: '👻 Navio Fantasma',
    pontos: 1,
    img: 'https://i.imgur.com/W2Z6v9P.png'
  },
  raid: {
    nome: '🏴‍☠️ Raid',
    pontos: 1,
    img: 'https://i.imgur.com/Jl6hX9Q.png'
  }
};

// ======================================================
// 📌 COMANDO !evento
// ======================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!evento') {

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🌊 | REGISTRAR EVENTO DO MAR')
      .setDescription(
        '📸 Envie a prova corretamente:\n\n' +
        '• Momento da finalização\n' +
        '• Evento visível\n' +
        '• Seu nick aparecendo\n\n' +
        '📌 Depois escolha o evento abaixo'
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('📌 Escolha o evento')
        .addOptions([
          {
            label: 'Leviathan',
            description: 'Vale 3 pontos',
            value: 'leviathan',
            emoji: '🐉'
          },
          {
            label: 'Terroshark',
            description: 'Vale 1 ponto',
            value: 'terroshark',
            emoji: '🦈'
          },
          {
            label: 'Sea Beast',
            description: 'Vale 1 ponto',
            value: 'seabest',
            emoji: '🌊'
          },
          {
            label: 'Ilha do Vulcão',
            description: 'Vale 2 pontos',
            value: 'vulcao',
            emoji: '🌋'
          },
          {
            label: 'Navio Fantasma',
            description: 'Vale 1 ponto',
            value: 'fantasma',
            emoji: '👻'
          },
          {
            label: 'Raid',
            description: 'Vale 1 ponto',
            value: 'raid',
            emoji: '🏴‍☠️'
          }
        ])
    );

    await message.channel.send({
      embeds: [embed],
      components: [menu]
    });
  }
});

// ======================================================
// 🔘 INTERAÇÃO MENU
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'select_evento') {

    await interaction.deferReply({ ephemeral: true });

    const escolha = interaction.values[0];
    const evento = eventos[escolha];

    if (!evento) {
      return interaction.editReply('Erro no evento.');
    }

    // ======================================================
    // 🧵 CRIAR TÓPICO
    // ======================================================

    const thread = await interaction.channel.threads.create({
      name: `${THREAD_PREFIX}${Date.now()}`,
      type: ChannelType.PublicThread,
      autoArchiveDuration: 60
    });

    // ======================================================
    // 👥 ADICIONAR MEMBROS
    // ======================================================

    await thread.members.add(interaction.user.id);

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

    if (staffRole) {
      for (const membro of staffRole.members.values()) {
        await thread.members.add(membro.id).catch(() => {});
      }
    }

    // ======================================================
    // 📦 PEGAR IMAGEM
    // ======================================================

    const attachment = interaction.message.attachments.first();

    // ======================================================
    // 📊 EMBED DO EVENTO
    // ======================================================

    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle(`📊 ${evento.nome}`)
      .setDescription(`👤 Jogador: <@${interaction.user.id}>\n⭐ Pontos: ${evento.pontos}`)
      .setImage(attachment ? attachment.url : evento.img);

    // ======================================================
    // 🎯 BOTÕES STAFF
    // ======================================================

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${interaction.user.id}_${evento.pontos}`)
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    // ======================================================
    // 📤 ENVIAR NO TÓPICO
    // ======================================================

    await thread.send({
      content: `📢 | ${interaction.user}`,
      embeds: [embed],
      components: [botoes]
    });

    await interaction.editReply('✅ Evento enviado! Vá até o tópico.');
  }
});

// ======================================================
// 🎯 BOTÕES STAFF
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith('aprovar_') && !interaction.customId.startsWith('recusar_')) return;

  await interaction.deferReply({ ephemeral: true });

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

  if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
    return interaction.editReply('❌ Apenas staff.');
  }

  const partes = interaction.customId.split('_');
  const acao = partes[0];
  const userId = partes[1];
  const pontos = parseInt(partes[2]) || 0;

  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  if (acao === 'aprovar') {

    eco.addMoney(userId, pontos);

    if (member) {
      member.send(`✅ Evento aprovado! +${pontos} pontos`).catch(()=>{});
    }

    await interaction.editReply('✅ Aprovado');

    setTimeout(() => {
      interaction.channel.delete().catch(()=>{});
    }, 3000);
  }

  if (acao === 'recusar') {

    if (member) {
      member.send('❌ Evento recusado').catch(()=>{});
    }

    await interaction.editReply('❌ Recusado');

    setTimeout(() => {
      interaction.channel.delete().catch(()=>{});
    }, 3000);
  }
});

};
