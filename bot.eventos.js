// ======================================================
// 🌊 SISTEMA EVENTOS DO MAR — COMPLETO (300+ LINHAS)
// ======================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// ======================================================
// ⚙️ CONFIGURAÇÕES
// ======================================================

const STAFF_ROLE_NAME = 'Moderador Staff';
const THREAD_PREFIX = 'evento-';
const AUTO_DELETE = 5000;

// ======================================================
// 📊 EVENTOS CONFIG
// ======================================================

const EVENTOS = {
  leviathan: {
    nome: '🐉 Leviathan',
    pontos: 3,
    cor: '#22c55e',
    img: 'https://i.imgur.com/7b1W3dP.png'
  },
  terroshark: {
    nome: '🦈 Terroshark',
    pontos: 1,
    cor: '#0ea5e9',
    img: 'https://i.imgur.com/3ZQ3Z9H.png'
  },
  seabest: {
    nome: '🌊 Sea Beast',
    pontos: 1,
    cor: '#3b82f6',
    img: 'https://i.imgur.com/xP9XK7S.png'
  },
  vulcao: {
    nome: '🌋 Ilha do Vulcão',
    pontos: 2,
    cor: '#ef4444',
    img: 'https://i.imgur.com/yZ8kF8T.png'
  },
  fantasma: {
    nome: '👻 Navio Fantasma',
    pontos: 1,
    cor: '#a855f7',
    img: 'https://i.imgur.com/W2Z6v9P.png'
  },
  raid: {
    nome: '🏴‍☠️ Raid',
    pontos: 1,
    cor: '#facc15',
    img: 'https://i.imgur.com/Jl6hX9Q.png'
  }
};

// ======================================================
// 🧠 FUNÇÕES AUXILIARES
// ======================================================

function getStaffRole(guild) {
  return guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
}

function criarEmbedPainel() {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🌊 | REGISTRAR EVENTO DO MAR')
    .setDescription(
      '📸 **Envie a prova corretamente:**\n\n' +
      '• Momento da finalização\n' +
      '• Evento visível\n' +
      '• Seu nick aparecendo\n\n' +
      '📌 Depois escolha o evento abaixo'
    );
}

function criarMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('menu_evento')
      .setPlaceholder('📌 Escolha o evento')
      .addOptions(
        Object.entries(EVENTOS).map(([key, e]) => ({
          label: e.nome.replace(/^[^\s]+\s/, ''),
          description: `Vale ${e.pontos} ponto(s)`,
          value: key,
          emoji: e.nome.split(' ')[0]
        }))
      )
  );
}

function criarEmbedEvento(user, evento, imagem) {
  return new EmbedBuilder()
    .setColor(evento.cor)
    .setTitle(`📊 ${evento.nome}`)
    .setDescription(
      `👤 Jogador: <@${user.id}>\n` +
      `⭐ Pontos: ${evento.pontos}\n\n` +
      `📌 Aguarde avaliação da staff`
    )
    .setImage(imagem || evento.img)
    .setFooter({ text: 'Sistema Frostvow' });
}

function criarBotoes(userId, pontos) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${userId}_${pontos}`)
      .setLabel('✅ Aprovar')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`recusar_${userId}`)
      .setLabel('❌ Recusar')
      .setStyle(ButtonStyle.Danger)
  );
}

// ======================================================
// 📌 COMANDO !evento
// ======================================================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  if (message.content === '!evento') {

    await message.channel.send({
      embeds: [criarEmbedPainel()],
      components: [criarMenu()]
    });

  }

});

// ======================================================
// 🎯 INTERAÇÃO MENU
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'menu_evento') return;

  await interaction.deferReply({ ephemeral: true });

  const escolha = interaction.values[0];
  const evento = EVENTOS[escolha];

  if (!evento) {
    return interaction.editReply('❌ Evento inválido.');
  }

  // ======================================================
  // 🧵 CRIAR THREAD PRIVADA
  // ======================================================

  const thread = await interaction.channel.threads.create({
    name: `${THREAD_PREFIX}${interaction.user.id}`,
    type: ChannelType.PrivateThread,
    invitable: false,
    autoArchiveDuration: 60
  });

  // ======================================================
  // 👥 ADICIONAR USUÁRIO
  // ======================================================

  await thread.members.add(interaction.user.id);

  // ======================================================
  // 👮 ADICIONAR STAFF
  // ======================================================

  const staffRole = getStaffRole(interaction.guild);

  if (staffRole) {
    for (const membro of staffRole.members.values()) {
      await thread.members.add(membro.id).catch(()=>{});
    }
  }

  // ======================================================
  // 📸 PEGAR IMAGEM
  // ======================================================

  const imagem = interaction.message.attachments.first()?.url;

  // ======================================================
  // 📊 ENVIAR PAINEL
  // ======================================================

  await thread.send({
    content: `📢 ${interaction.user}`,
    embeds: [criarEmbedEvento(interaction.user, evento, imagem)],
    components: [criarBotoes(interaction.user.id, evento.pontos)]
  });

  await interaction.editReply('✅ Evento enviado para análise da staff.');

});

// ======================================================
// 🎯 BOTÕES
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith('aprovar_') &&
      !interaction.customId.startsWith('recusar_')) return;

  await interaction.deferReply({ ephemeral: true });

  const staffRole = getStaffRole(interaction.guild);

  if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
    return interaction.editReply('❌ Apenas staff pode usar.');
  }

  const partes = interaction.customId.split('_');
  const acao = partes[0];
  const userId = partes[1];
  const pontos = parseInt(partes[2]) || 0;

  const member = await interaction.guild.members.fetch(userId).catch(()=>null);

  // ======================================================
  // ✅ APROVAR
  // ======================================================

  if (acao === 'aprovar') {

    eco.addMoney(userId, pontos);

    if (member) {
      member.send(`✅ Seu evento foi aprovado!\n⭐ +${pontos} pontos`).catch(()=>{});
    }

    await interaction.editReply('✅ Evento aprovado.');

    setTimeout(() => {
      interaction.channel.delete().catch(()=>{});
    }, AUTO_DELETE);
  }

  // ======================================================
  // ❌ RECUSAR
  // ======================================================

  if (acao === 'recusar') {

    if (member) {
      member.send('❌ Seu evento foi recusado.').catch(()=>{});
    }

    await interaction.editReply('❌ Evento recusado.');

    setTimeout(() => {
      interaction.channel.delete().catch(()=>{});
    }, AUTO_DELETE);
  }

});

};
