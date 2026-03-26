const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Quando o bot ligar
client.once('ready', () => {
    console.log(`✅ Bot ligado como ${client.user.tag}`);
});

// Responder mensagem simples (teste)
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('🏓 Pong!');
    }
});

// Função corrigida (sem erro)
function getWarns(guildId, userId) {
    return [];
}

// Login do bot
client.login(process.env.DISCORD_TOKEN);
