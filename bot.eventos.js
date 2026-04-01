const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// CONFIG
const CANAL = '💬丨ɢᴇʀᴀʟ';
const STAFF_ROLE = 'Moderador Staff';
const PREFIX = 'evento-';

// TIPOS DE EVENTO
const EVENTOS = {
  hunt: { nome: 'Sea Hunt', pontos: 1000 },
  boss: { nome: 'Boss', pontos: 1500 },
  pvp: { nome: 'PvP', pontos: 800 },
  raid: { nome: 'Raid', pontos: 1200 }
};

// ================= COMANDO =================
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!evento') {

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_evento')
        .setPlaceholder('Escolha o tipo de evento')
        .addOptions(
          {
            label: 'Sea Hunt',
            value: 'hunt',
            description: 'Caça marítima'
          },
          {
            label: 'Boss',
            value: 'boss',
            description: 'Derrotar boss'
          },
          {
            label: 'PvP',
            value: 'pvp',
            description: 'Combate jogador'
          },
          {
            label: 'Raid',
            value: 'raid',
            description: 'Ataque em grupo'
          }
        )
    );

    await msg.channel.send({
      content: '🌊 Escolha o tipo de evento:',
      components: [menu]
    });
  }
});

// ================= MENU =================
client.on('interactionCreate', async (i) => {

  if (i.isStringSelectMenu() && i.customId === 'select_evento') {

    const tipo = i.values[0];
    const dados = EVENTOS[tipo];

    const thread = await i.channel.threads.create({
      name: `${PREFIX}${i.user.id}`,
      type: ChannelType.PrivateThread
    });

    await thread.members.add(client.user.id);
    await thread.members.add(i.user.id);

    const staff = i.guild.roles.cache.find(r => r.name === STAFF_ROLE);
    if (staff) {
      for (const m of staff.members.values()) {
        await thread.members.add(m.id).catch(()=>{});
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setTitle('🌊┃EVENTO DO MAR')
      .setDescription(
`📌 Tipo: **${dados.nome}**
🏆 Pontos: **${dados.pontos}**

Envie sua prova abaixo (imagem/vídeo).`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${tipo}`)
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${tipo}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({ embeds: [embed], components: [row] });

    await i.reply({ content: '✅ Evento criado!', ephemeral: true });
  }

  // ================= BOTÕES =================
  if (i.isButton()) {

    const [acao, tipo] = i.customId.split('_');

    if (!tipo) return;

    await i.deferReply({ ephemeral: true });

    const staff = i.guild.roles.cache.find(r => r.name === STAFF_ROLE);
    if (!staff || !i.member.roles.cache.has(staff.id)) {
      return i.editReply('❌ Apenas staff.');
    }

    const dados = EVENTOS[tipo];
    const userId = i.channel.name.replace(PREFIX, '');
    const member = await i.guild.members.fetch(userId).catch(()=>null);

    if (acao === 'aprovar') {

      eco.addMoney(userId, dados.pontos);

      if (member) {
        member.send(`✅ Evento aprovado! +${dados.pontos} moedas`).catch(()=>{});
      }

      await i.editReply(`✅ Aprovado (+${dados.pontos})`);

      setTimeout(() => i.channel.delete().catch(()=>{}), 3000);
    }

    if (acao === 'recusar') {

      if (member) {
        member.send('❌ Evento recusado.').catch(()=>{});
      }

      await i.editReply('❌ Recusado.');

      setTimeout(() => i.channel.delete().catch(()=>{}), 3000);
    }
  }

});

};
