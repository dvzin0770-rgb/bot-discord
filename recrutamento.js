const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const respostas = new Map();

module.exports = (client) => {

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'aplicar') {
      respostas.set(interaction.user.id, []);
      await interaction.reply({ content: 'Qual seu Nick?', ephemeral: true });
    }

    if (interaction.customId === 'aprovar') {
      const id = interaction.message.content;
      const membro = await interaction.guild.members.fetch(id);

      let cargo = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Membros da crew');
      if (!cargo) {
        cargo = await interaction.guild.roles.create({ name: '⃤⃟⃝Membros da crew' });
      }

      await membro.roles.add(cargo);
      await interaction.update({ content: '✅ Aprovado', components: [] });
      membro.send('🎉 Você foi aprovado!');
    }

    if (interaction.customId === 'recusar') {
      const id = interaction.message.content;
      const membro = await interaction.guild.members.fetch(id);

      await interaction.update({ content: '❌ Recusado', components: [] });
      membro.send('❌ Você foi recusado.');
    }
  });

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
