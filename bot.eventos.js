// =====================================================
// 🌊 EVENTOS DO MAR (VERSÃO CORRIGIDA COM SUAS OPÇÕES)
// =====================================================

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// =====================================================
// ⚙️ CONFIG
// =====================================================

const STAFF_ROLE = 'Moderador Staff';

// PONTOS BASEADOS NA SUA IMAGEM
const EVENTOS = {
  leviathan: { nome: '🐉 Leviathan', pontos: 3 },
  terroshark: { nome: '🦈 Terroshark', pontos: 1 },
  seabeast: { nome: '🌊 Sea Beast', pontos: 1 },
  vulcao: { nome: '🌋 Ilha do Vulcão', pontos: 2 },
  navio: { nome: '👻 Navio Fantasma', pontos: 1 },
  raid: { nome: '⚔️ Raid', pontos: 1 }
};

// =====================================================
// 📌 COMANDO
// =====================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!evento') {

    const embed = new EmbedBuilder()
      .setColor('#7c3aed')
      .setTitle('🌊┃REGISTRAR EVENTO DO MAR')
      .setDescription(
        '📸 Envie a prova corretamente seguindo as regras:\n\n' +
        '• Deve ser no momento da finalização\n' +
        '• O evento deve estar visível\n' +
        '• Seu nick deve aparecer\n\n' +
        '📌 Depois escolha o evento abaixo'
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('evento_select')
        .setPlaceholder('📌 Escolha o evento')
        .addOptions([
          {
            label: '🐉 Leviathan',
            description: 'Vale 3 pontos',
            value: 'leviathan'
          },
          {
            label: '🦈 Terroshark',
            description: 'Vale 1 ponto',
            value: 'terroshark'
          },
          {
            label: '🌊 Sea Beast',
            description: 'Vale 1 ponto',
            value: 'seabeast'
          },
          {
            label: '🌋 Ilha do Vulcão',
            description: 'Vale 2 pontos',
            value: 'vulcao'
          },
          {
            label: '👻 Navio Fantasma',
            description: 'Vale 1 ponto',
            value: 'navio'
          },
          {
            label: '⚔️ Raid',
            description: 'Vale 1 ponto',
            value: 'raid'
          }
        ])
    );

    await message.channel.send({
      embeds: [embed],
      components: [menu]
    });
  }
});

// =====================================================
// 🎯 INTERAÇÕES
// =====================================================

client.on('interactionCreate', async (interaction) => {

  // ================= MENU =================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === 'evento_select') {

      const tipo = interaction.values[0];
      const dados = EVENTOS[tipo];

      await interaction.deferReply({ ephemeral: true });

      // CRIA TÓPICO
      const thread = await interaction.channel.threads.create({
        name: `evento-${interaction.user.id}`,
        type: ChannelType.PublicThread,
        autoArchiveDuration: 60
      });

      await thread.members.add(interaction.user.id);

      // EMBED DO TÓPICO
      const embed = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('📸┃ENVIE SUA PROVA')
        .setDescription(
          `👤 <@${interaction.user.id}>\n\n` +
          `📌 Evento: **${dados.nome}**\n` +
          `🏆 Pontos: **${dados.pontos}**\n\n` +
          `Envie a imagem abaixo.\nA staff irá analisar.`
        );

      const botoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aprovar_${interaction.user.id}_${tipo}`)
          .setLabel('Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`recusar_${interaction.user.id}`)
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
      );

      await thread.send({
        embeds: [embed],
        components: [botoes]
      });

      await interaction.editReply('✅ Evento criado! Vá até o tópico.');
    }
  }

  // ================= BOTÕES =================
  if (interaction.isButton()) {

    await interaction.deferReply({ ephemeral: true });

    const staff = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE);

    if (!staff || !interaction.member.roles.cache.has(staff.id)) {
      return interaction.editReply('❌ Apenas staff.');
    }

    const id = interaction.customId;

    // ================= APROVAR =================
    if (id.startsWith('aprovar_')) {

      const [_, userId, tipo] = id.split('_');
      const dados = EVENTOS[tipo];

      eco.addMoney(userId, dados.pontos);

      const membro = await interaction.guild.members.fetch(userId).catch(()=>null);

      if (membro) {
        membro.send(`✅ Evento aprovado!\n🏆 +${dados.pontos} pontos`).catch(()=>{});
      }

      await interaction.editReply(`✅ Aprovado (+${dados.pontos})`);

      setTimeout(() => {
        interaction.channel.delete().catch(()=>{});
      }, 3000);
    }

    // ================= RECUSAR =================
    if (id.startsWith('recusar_')) {

      const userId = id.split('_')[1];

      const membro = await interaction.guild.members.fetch(userId).catch(()=>null);

      if (membro) {
        membro.send('❌ Evento recusado.').catch(()=>{});
      }

      await interaction.editReply('❌ Recusado');

      setTimeout(() => {
        interaction.channel.delete().catch(()=>{});
      }, 3000);
    }
  }

});

};
