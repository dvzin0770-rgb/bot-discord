const { 
    Client, 
    GatewayIntentBits, 
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

client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
});

// =======================
// COMANDOS PREFIXO (!)
// =======================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.split(" ");
    const cmd = args[0];

    // TESTE
    if (cmd === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // PAINEL DE TICKET
    if (cmd === "!ticket") {

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_criar")
                .setLabel("🎫 Abrir Ticket")
                .setStyle(ButtonStyle.Primary)
        );

        message.channel.send({
            content: "🎫 Clique no botão para abrir um ticket",
            components: [botao]
        });
    }
});

// =======================
// BOTÕES (INTERACTIONS)
// =======================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // CRIAR TICKET
    if (interaction.customId === 'ticket_criar') {

        await interaction.reply({
            content: '🎫 Criando seu ticket...',
            ephemeral: true
        });

        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("fechar_ticket")
                .setLabel("🔒 Fechar Ticket")
                .setStyle(ButtonStyle.Danger)
        );

        canal.send({
            content: `🎫 Olá ${interaction.user}, explique seu problema.\n🔒 Apenas você e a staff podem ver este canal.`,
            components: [botoes]
        });
    }

    // FECHAR TICKET
    if (interaction.customId === 'fechar_ticket') {
        await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });

        setTimeout(() => {
            interaction.channel.delete();
        }, 2000);
    }
});

// =======================
// LOGIN
// =======================
client.login(process.env.DISCORD_TOKEN);
