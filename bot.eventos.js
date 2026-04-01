// ======================================================
// 🌊 SISTEMA EVENTOS DO MAR (CORRIGIDO DE VERDADE)
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
// 🎯 EVENTOS
// ======================================================

const eventos = {
  leviathan: { nome: '🐉 Leviathan', pontos: 3, img: 'https://i.imgur.com/7b1W3dP.png' },
  terroshark: { nome: '🦈 Terroshark', pontos: 1, img: 'https://i.imgur.com/3ZQ3Z9H.png' },
  seabest: { nome: '🌊 Sea Beast', pontos: 1, img: 'https://i.imgur.com/xP9XK7S.png' },
  vulcao: { nome: '🌋 Ilha do Vulcão', pontos: 2, img: 'https://i.imgur.com/yZ8kF8T.png' },
  fantasma: { nome: '👻 Navio Fantasma', pontos: 1, img: 'https://i.imgur.com/W2Z6v9P.png' },
  raid: { nome: '🏴‍☠️ Raid', pontos: 1, img: 'https://i.imgur.com/Jl6hX9Q.png' }
};

// ======================================================
// 📌 COMANDO
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
        '📌 Escolha abaixo:'
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('📌 Escolha o evento')
        .addOptions(
          Object.entries(eventos).map(([key, e]) => ({
            label: e.nome.replace(/^[^\s]+\s/, ''),
            description: `Vale ${e.pontos} ponto(s)`,
            value: key,
            emoji: e.nome.split(' ')[0]
          }))
        )
    );

    await message.channel.send({ embeds: [embed], components: [menu] });
  }
});

// ======================================================
// 🔘 MENU
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'select_evento') return;

  await interaction.deferReply({ ephemeral: true });

  const escolha = interaction.values[0];
  const evento = eventos[escolha];

  // ======================================================
  // 🧵 CRIAR THREAD
  // ======================================================

  const thread = await interaction.channel.threads.create({
    name: `${THREAD_PREFIX}${interaction.user.id}`,
    type: ChannelType.PublicThread,
    autoArchiveDuration: 60
  });

  // ======================================================
  // ❌ APAGAR MENSAGEM "INICIOU UM TÓPICO"
  // ======================================================

  try {
    const msgs = await interaction.channel.messages.fetch({ limit: 5 });
    const systemMsg = msgs.find(m =>
      m.type === 18 && // THREAD_CREATED
      m.author.id === client.user.id
    );
    if (systemMsg) await systemMsg.delete().catch(()=>{});
  } catch {}

  // ======================================================
  // 👥 ADD MEMBROS
  // ======================================================

  await thread.members.add(interaction.user.id);

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

  if (staffRole) {
    for (const m of staffRole.members.values()) {
      await thread.members.add(m.id).catch(()=>{});
    }
  }

  // ======================================================
  // 📸 IMAGEM
  // ======================================================

  const attachment = interaction.message.attachments.first();

  // ======================================================
  // 📊 EMBED
  // ======================================================

  const embed = new EmbedBuilder()
    .setColor('#22c55e')
    .setTitle(`📊 ${evento.nome}`)
    .setDescription(
      `👤 Jogador: <@${interaction.user.id}>\n` +
      `⭐ Pontos: ${evento.pontos}\n\n` +
      `📌 Staff: avaliem abaixo`
    )
    .setImage(attachment ? attachment.url : evento.img);

  // ======================================================
  // 🎯 BOTÕES
  // ======================================================

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${interaction.user.id}_${evento.pontos}`)
      .setLabel('✅ Aprovar')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`recusar_${interaction.user.id}`)
      .setLabel('❌ Recusar')
      .setStyle(ButtonStyle.Danger)
  );

  // ======================================================
  // 📤 ENVIAR NO THREAD
  // ======================================================

  await thread.send({
    content: `📢 ${interaction.user}`,
    embeds: [embed],
    components: [botoes]
  });

  await interaction.editReply('✅ Evento criado.');
});

// ======================================================
// 🎯 BOTÕES
// ======================================================

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith('aprovar_') &&
      !interaction.customId.startsWith('recusar_')) return;

  await interaction.deferReply({ ephemeral: true });

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

  if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
    return interaction.editReply('❌ Apenas staff.');
  }

  const partes = interaction.customId.split('_');
  const acao = partes[0];
  const userId = partes[1];
  const pontos = parseInt(partes[2]) || 0;

  const member = await interaction.guild.members.fetch(userId).catch(()=>null);

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
