const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = (client) => {

  const DB_PATH = './eventos.json';

  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));

  const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
  const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  // ===== COMANDO !evento =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!evento')) return;

    // só staff pode criar
    const staffRole = message.guild.roles.cache.find(r => r.name === '⃤⃟⃝Suporte');
    if (!staffRole || !message.member.roles.cache.has(staffRole.id)) {
      return message.reply('❌ Apenas staff pode criar eventos.');
    }

    const args = message.content.slice('!evento'.length).trim().split('|').map(a => a.trim());
    if (args.length < 3) return message.reply('❌ Uso: !evento Nome do Evento | 10m | Prêmio');

    const [nome, duracaoStr, premio] = args;

    // converter duração
    const duracaoMatch = duracaoStr.match(/(\d+)(m|h|s)/);
    if (!duracaoMatch) return message.reply('❌ Duração inválida, ex: 10m');
    const valor = parseInt(duracaoMatch[1]);
    const unidade = duracaoMatch[2];

    let duracaoMs;
    if (unidade === 's') duracaoMs = valor * 1000;
    if (unidade === 'm') duracaoMs = valor * 60 * 1000;
    if (unidade === 'h') duracaoMs = valor * 60 * 60 * 1000;

    // cria cargo ping sorteios se não existir
    let pingRole = message.guild.roles.cache.find(r => r.name === 'ping sorteios');
    if (!pingRole) {
      pingRole = await message.guild.roles.create({
        name: 'ping sorteios',
        color: 'Purple',
        permissions: []
      });
    }

    const pingMention = `<@&${pingRole.id}>`;

    // embed detalhado
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Sorteio Especial: ${nome}`)
      .setDescription(`🎁 **Prêmio:** ${premio}\n⏱️ **Duração:** ${duracaoStr}\nClique no botão abaixo para participar!\n${pingMention}`)
      .setColor('#8A2BE2')
      .setFooter({ text: 'Boa sorte a todos!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('participar_evento').setLabel('🎉 Participar').setStyle(ButtonStyle.Primary)
    );

    const eventoMsg = await message.channel.send({ embeds: [embed], components: [row] });

    // salva no JSON
    const db = getDB();
    db[eventoMsg.id] = {
      nome,
      premio,
      participantes: [],
      fim: Date.now() + duracaoMs
    };
    saveDB(db);

    // timer pra finalizar
    setTimeout(async () => {
      const data = getDB();
      const evento = data[eventoMsg.id];
      if (!evento) return;

      // sorteio
      let vencedor;
      if (evento.participantes.length > 0) {
        const idx = Math.floor(Math.random() * evento.participantes.length);
        vencedor = evento.participantes[idx];
      }

      const resultadoEmbed = new EmbedBuilder()
        .setTitle(`🎉 Resultado: ${evento.nome}`)
        .setDescription(
          vencedor
            ? `🏆 Parabéns <@${vencedor}>! Você ganhou **${evento.premio}**!`
            : '⚠️ Nenhum participante.'
        )
        .setColor('#FFD700')
        .setTimestamp();

      await message.channel.send({ embeds: [resultadoEmbed] });

      // remove do JSON
      delete data[eventoMsg.id];
      saveDB(data);

    }, duracaoMs);
  });

  // ===== PARTICIPAR =====
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'participar_evento') return;

    const db = getDB();
    const evento = db[interaction.message.id];
    if (!evento) return interaction.reply({ content: '❌ Evento expirado ou não encontrado.', ephemeral: true });

    const userId = interaction.user.id;
    if (evento.participantes.includes(userId)) {
      return interaction.reply({ content: '❌ Você já está participando deste evento!', ephemeral: true });
    }

    evento.participantes.push(userId);
    saveDB(db);

    return interaction.reply({ content: '🎉 Você entrou no evento com sucesso!', ephemeral: true });
  });

};
