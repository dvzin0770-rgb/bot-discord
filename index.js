const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const recrutamentoRespostas = new Map();

client.once('ready', async () => {
    console.log(`✅ Bot ligado como ${client.user.tag}`);

    const suporte = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');
    if (suporte) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎫 Central de Suporte')
            .setDescription('Clique abaixo para abrir um ticket');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket')
                .setLabel('🎟️ Abrir Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await suporte.send({ embeds: [embed], components: [row] });
    }

    const recrutamento = client.channels.cache.find(c => c.name === 'recrutamento');
    if (recrutamento) {
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('📩 Recrutamento')
            .setDescription('Clique abaixo para aplicar');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('aplicar')
                .setLabel('📩 Aplicar')
                .setStyle(ButtonStyle.Success)
        );

        await recrutamento.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // ================= TICKET =================
    if (interaction.customId === 'ticket') {

        await interaction.deferReply({ ephemeral: true });

        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
            ]
        });

        await interaction.editReply({ content: `✅ Ticket criado: ${canal}` });

        const embed = new EmbedBuilder()
            .setTitle('🎫 Suporte - Ticket')
            .setDescription(`Olá ${interaction.user}\nExplique seu problema`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('fechar')
                .setLabel('🔒 Fechar')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('assumir')
                .setLabel('👮 Assumir')
                .setStyle(ButtonStyle.Primary)
        );

        canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
    }

    if (interaction.customId === 'fechar') {
        await interaction.reply({ content: '🔒 Ticket fechado', ephemeral: true });
        setTimeout(() => interaction.channel.delete(), 3000);
    }

    if (interaction.customId === 'assumir') {
        await interaction.reply({ content: `👮 ${interaction.user} assumiu o ticket` });
    }

    // ================= RECRUTAMENTO =================
    if (interaction.customId === 'aplicar') {
        recrutamentoRespostas.set(interaction.user.id, []);
        await interaction.reply({ content: 'Qual seu Nick?', ephemeral: true });
    }

    if (interaction.customId === 'aprovar') {
        const userId = interaction.message.content.match(/\d+/)[0];
        const membro = await interaction.guild.members.fetch(userId);

        let cargo = interaction.guild.roles.cache.find(r => r.name === '⃤⃟⃝Membros da crew');
        if (!cargo) {
            cargo = await interaction.guild.roles.create({ name: '⃤⃟⃝Membros da crew' });
        }

        await membro.roles.add(cargo);

        await interaction.update({ content: '✅ Aprovado', components: [] });
        membro.send('🎉 Você foi aprovado na crew!');
    }

    if (interaction.customId === 'recusar') {
        const userId = interaction.message.content.match(/\d+/)[0];
        const membro = await interaction.guild.members.fetch(userId);

        await interaction.update({ content: '❌ Recusado', components: [] });
        membro.send('❌ Você foi recusado.');
    }
});

// ================= RESPOSTAS =================
client.on('messageCreate', async (msg) => {
    if (!recrutamentoRespostas.has(msg.author.id)) return;

    const respostas = recrutamentoRespostas.get(msg.author.id);
    respostas.push(msg.content);

    const perguntas = [
        'Qual seu Nick?',
        'Qual sua idade?',
        'Quanto de bounty você tem?',
        'Joga em qual plataforma?'
    ];

    if (respostas.length < perguntas.length) {
        msg.reply(perguntas[respostas.length]);
    } else {
        recrutamentoRespostas.delete(msg.author.id);

        let canal = msg.guild.channels.cache.find(c => c.name === 'recrutamento-aprovacao');
        if (!canal) {
            canal = await msg.guild.channels.create({ name: 'recrutamento-aprovacao', type: 0 });
        }

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('📩 Nova aplicação')
            .setDescription(`
👤 ${msg.author}

Nick: ${respostas[0]}
Idade: ${respostas[1]}
Bounty: ${respostas[2]}
Plataforma: ${respostas[3]}
`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('aprovar').setLabel('✅ Aprovar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('recusar').setLabel('❌ Recusar').setStyle(ButtonStyle.Danger)
        );

        canal.send({ content: msg.author.id, embeds: [embed], components: [row] });

        msg.reply('✅ Aplicação enviada!');
    }
});

client.login(process.env.DISCORD_TOKEN);
