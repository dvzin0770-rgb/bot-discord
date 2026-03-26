const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const respostas = new Map();

// FUNÇÃO PRA ENVIAR O PAINEL (!recrutamento)
async function enviarPainel(channel) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚓ Recrutamento da Tripulação')
    .setDescription('Clique no botão abaixo para aplicar!')
    .addFields(
      { name: '📋 Requisitos', value: '• Ser ativo\n• Respeitar regras' },
      { name: '⏳ Processo', value: 'Staff irá analisar sua aplicação.' }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('aplicar')
      .setLabel('📩 Aplicar')
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

module.exports = (client) => {

  // BOTÕES
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // CLICOU EM APLICAR
    if (interaction.customId === 'aplicar') {
      respostas.set(interaction.user.id, []);
      await interaction.reply({ content: 'Qual seu Nick?', ephemeral: true });
    }

    // APROVAR
    if (interaction.customId === 'aprovar') {
      const id = interaction.message.content;
      const membro = await interaction.guild.members.fetch(id);

      let cargo = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Membros da crew');
      if (!cargo) {
        cargo = await interaction.guild.roles.create({ name: '⃤⃟⃝Membros da crew' });
      }

      await membro.roles.add(cargo);
      await interaction.update({ content: '✅ Aprovado', components: [] });

      membro.send('🎉 Você foi aprovado na crew!');
    }

    // RECUSAR
    if (interaction.customId === 'recusar') {
      const id = interaction.message.content;
      const membro = await interaction.guild.members.fetch(id);

      await interaction.update({ content: '❌ Recusado', components: [] });

      membro.send('❌ Você foi recusado.');
    }
  });

  // PERGUNTAS
  client.on('messageCreate', async (msg) => {
    if (!respostas.has(msg.author.id)) return;

    const userRespostas = respostas.get(msg.author.id);
    userRespostas.push(msg.content);

    const perguntas = [
      'Qual seu Nick?',
      'Qual sua idade?',
      'Quanto de bounty você tem?',
      'Joga em qual plataforma?'
    ];

    if (userRespostas.length < perguntas.length) {
      msg.reply(perguntas[userRespostas.length]);
    } else {
      respostas.delete(msg.author.id);

      let canal = msg.guild.channels.cache.find(c => c.name === 'recrutamento-aprovacao');
      if (!canal) {
        canal = await msg.guild.channels.create({ name: 'recrutamento-aprovacao' });
      }

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('📩 Nova aplicação')
        .setDescription(`
👤 ${msg.author}

Nick: ${userRespostas[0]}
Idade: ${userRespostas[1]}
Bounty: ${userRespostas[2]}
Plataforma: ${userRespostas[3]}
`);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('aprovar').setLabel('✅ Aprovar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('recusar').setLabel('❌ Recusar').setStyle(ButtonStyle.Danger)
      );

      canal.send({ content: msg.author.id, embeds: [embed], components: [row] });

      msg.reply('✅ Aplicação enviada!');
    }
  });

};

// EXPORTA A FUNÇÃO DO PAINEL
module.exports.enviarPainel = enviarPainel;
