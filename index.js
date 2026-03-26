const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// QUANDO O BOT LIGAR
client.once('ready', async () => {
    console.log(`✅ Bot ligado como ${client.user.tag}`);

    // ACHA O CANAL DE SUPORTE
    const canal = client.channels.cache.find(c => c.name === '❄️︱𝚜𝚞𝚙𝚘𝚛𝚝𝚎');

    if (canal) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎫 Central de Suporte')
            .setDescription('Precisa de ajuda? Abra um ticket e nossa equipe irá atendê-lo!')
            .addFields(
                { name: '📋 Como funciona?', value: 'Clique no botão abaixo para criar um canal privado.' },
                { name: '⏱️ Tempo de resposta', value: 'Respondemos o mais rápido possível.' },
                { name: '🔒 Privacidade', value: 'Apenas você e a staff podem ver.' }
            )
            .setFooter({ text: 'Suporte • Use apenas se necessário' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_criar')
                .setLabel('🎟️ Abrir Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await canal.send({ embeds: [embed], components: [row] });
    }
});

// BOTÕES
client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

    // CRIAR TICKET
    if (interaction.customId === 'ticket_criar') {

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
            .setColor('#5865F2')
            .setTitle('🎫 Suporte - Ticket')
            .setDescription(`Olá ${interaction.user}!\nExplique seu problema.\n\n🔒 Apenas você e a staff podem ver.`);

        await canal.send({ content: `${interaction.user}`, embeds: [embed] });
    }

    // BOTÃO DE RECRUTAMENTO
    if (interaction.customId === 'recrutar') {
        await interaction.reply({
            content: '📩 Responda:\nQual seu nick?\nQual seu nível?\nPor que quer entrar?\nQuanto tempo joga?',
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
