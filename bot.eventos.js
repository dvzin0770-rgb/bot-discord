// ======================= INDEX.JS ======================= const { Client, GatewayIntentBits, Partials } = require('discord.js'); require('dotenv').config();

const eventos = require('./bot.eventos');

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ], partials: [ Partials.Channel ] });

eventos(client);

client.once('ready', () => { console.log('Bot ligado como ' + client.user.tag); }); });

client.login(process.env.TOKEN);

// ======================= bot.eventos.js ======================= const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = (client) => {

const STAFF_ROLE_NAME = "Moderador Staff";

client.on('messageCreate', async (message) => { if (message.content === '!painel') {

const menu = new StringSelectMenuBuilder()
    .setCustomId('selecionar_evento')
    .setPlaceholder('Escolha o evento')
    .addOptions([
      {
        label: 'Sea Beast',
        value: 'sea_beast'
      },
      {
        label: 'Terror Shark',
        value: 'terror_shark'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await message.channel.send({
    content: "📊 **REGISTRO DE EVENTOS — FROSTVOW**\n\n1️⃣ Selecione o evento\n2️⃣ Envie a prova no tópico\n3️⃣ Aguarde staff",
    components: [row]
  });
}

});

client.on('interactionCreate', async (interaction) => {

if (interaction.isStringSelectMenu()) {

  if (interaction.customId === 'selecionar_evento') {

    const canal = interaction.channel;
    const membro = interaction.member;

    const thread = await canal.threads.create({
      name: `evento-${membro.user.username}`,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

    await thread.members.add(membro.id);

    if (staffRole) {
      staffRole.members.forEach(m => {
        thread.members.add(m.id);
      });
    }

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('aprovar')
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('recusar')
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({
      content: `📸 ${membro}, envie sua prova aqui.`,
      components: [botoes]
    });

    await interaction.reply({
      content: `✅ Tópico criado: ${thread}`,
      ephemeral: true
    });
  }
}

if (interaction.isButton()) {

  const membro = interaction.member;
  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

  if (!staffRole || !membro.roles.cache.has(staffRole.id)) {
    return interaction.reply({ content: '❌ Apenas staff pode usar.', ephemeral: true });
  }

  const thread = interaction.channel;

  if (interaction.customId === 'aprovar') {

    await interaction.reply('✅ Evento aprovado!');

    setTimeout(async () => {
      await thread.delete().catch(() => {});
    }, 2000);
  }

  if (interaction.customId === 'recusar') {

    await interaction.reply('❌ Evento recusado!');

    setTimeout(async () => {
      await thread.delete().catch(() => {});
    }, 2000);
  }
}

}); };
