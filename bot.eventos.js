// =====================================================
// 🌊 SISTEMA DE EVENTOS DO MAR (COMPLETO E BONITO)
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

const PONTOS = {
  'sea': 1000,
  'boss': 2000,
  'pvp': 1500,
  'raid': 2500
};

// =====================================================
// 📌 COMANDO !evento
// =====================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!evento') {

    const embed = new EmbedBuilder()
      .setColor('#0ea5e9')
      .setTitle('🌊 SISTEMA DE EVENTOS — FROSTVOW')
      .setDescription(
        'Escolha abaixo o tipo de evento que você realizou.\n\n' +
        '📸 Após isso, envie a **print no tópico criado**.\n' +
        '📊 A staff irá analisar e aprovar.'
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('🌊 Escolha o evento...')
        .addOptions([
          {
            label: '🌊 Sea Hunt',
            description: 'Caça marítima',
            value: 'sea'
          },
          {
            label: '👹 Boss',
            description: 'Derrotar boss',
            value: 'boss'
          },
          {
            label: '⚔️ PvP',
            description: 'Combate jogador',
            value: 'pvp'
          },
          {
            label: '🔥 Raid',
            description: 'Ataque em grupo',
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

    if (interaction.customId === 'select_evento') {

      const tipo = interaction.values[0];

      await interaction.deferReply({ ephemeral: true });

      // CRIAR TÓPICO
      const thread = await interaction.channel.threads.create({
        name: `evento-${interaction.user.id}`,
        type: ChannelType.PublicThread,
        autoArchiveDuration: 60
      });

      await thread.members.add(interaction.user.id);

      // EMBED BONITO
      const embed = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('📸 ENVIE SUA PROVA')
        .setDescription(
          `👤 <@${interaction.user.id}>\n\n` +
          `📌 Tipo: **${tipo.toUpperCase()}**\n\n` +
          `📷 Envie a print aqui.\n` +
          `⏳ Aguarde aprovação da staff.`
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
      return interaction.editReply('❌ Apenas staff pode usar.');
    }

    const id = interaction.customId;

    // ================= APROVAR =================
    if (id.startsWith('aprovar_')) {

      const partes = id.split('_');
      const userId = partes[1];
      const tipo = partes[2];

      const pontos = PONTOS[tipo] || 0;

      eco.addMoney(userId, pontos);

      const membro = await interaction.guild.members.fetch(userId).catch(()=>null);

      if (membro) {
        membro.send(`✅ Evento aprovado! +${pontos} coins`).catch(()=>{});
      }

      await interaction.editReply(`✅ Aprovado (+${pontos})`);

      setTimeout(() => {
        interaction.channel.delete().catch(()=>{});
      }, 3000);
    }

    // ================= RECUSAR =================
    if (id.startsWith('recusar_')) {

      const partes = id.split('_');
      const userId = partes[1];

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
