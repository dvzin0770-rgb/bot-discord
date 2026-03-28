const {
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
StringSelectMenuBuilder,
ChannelType,
EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'banco-eventos.json');

console.log("✅ bot.eventos.js carregado");

module.exports = (client) => {

const STAFF_ROLE_NAME = "Moderador Staff";

// ===== PAINEL =====
client.on('messageCreate', async (message) => {

console.log("📩 MSG RECEBIDA:", message.content);  

if (message.author.bot) return;  
if (!message.guild) return;  

if (message.content.toLowerCase() !== '!painel') return;  

const embed = new EmbedBuilder()  
  .setColor('#2b2d31')  
  .setTitle('📊 REGISTRO DE EVENTOS — FROSTVOW')  
  .setDescription(`1️⃣ Selecione o evento

2️⃣ Envie a prova no tópico
3️⃣ Aguarde aprovação da staff

📸 Prova obrigatória`);

const menu = new StringSelectMenuBuilder()  
  .setCustomId('evento_menu')  
  .setPlaceholder('Escolha o evento')  
  .addOptions([  
    { label: '🐉 Leviathan', value: 'leviathan_3' },  
    { label: '🦈 Terror Shark', value: 'terror_1' },  
    { label: '🌊 Sea Beast', value: 'seabeast_1' },  
    { label: '🌋 Ilha do Vulcão', value: 'vulcao_2' },  
    { label: '👻 Navio Fantasma', value: 'navio_1' },  
    { label: '⚔️ Raids', value: 'raids_1' }  
  ]);  

const row = new ActionRowBuilder().addComponents(menu);  

await message.channel.send({  
  embeds: [embed],  
  components: [row]  
});  

console.log("✅ Painel enviado");

});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (interaction) => {

// ===== MENU =====  
if (interaction.isStringSelectMenu()) {  
  if (interaction.customId !== 'evento_menu') return;  

  const partes = interaction.values[0].split('_');  
  const pontos = parseInt(partes[1]);  

  const membro = interaction.member;  
  const canal = interaction.channel;  

  await interaction.deferReply({ ephemeral: true });  

  const thread = await canal.threads.create({  
    name: `evento-${membro.user.username}`,  
    type: ChannelType.PrivateThread,  
    invitable: false,  
    autoArchiveDuration: 1440  
  });  

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);  

  await thread.members.add(membro.id);

// 🔥 PERMISSÃO
setTimeout(async () => {
  try {
    await thread.permissionOverwrites.edit(membro.id, {
      SendMessages: true,
      ViewChannel: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });
  } catch (err) {
    console.log("Erro permissão:", err);
  }
}, 1200);

  if (staffRole) {  
    for (const m of staffRole.members.values()) {  
      await thread.members.add(m.id).catch(() => {});  
    }  
  }  

  await thread.setArchived(false);  
  await thread.setLocked(false);  

  await thread.send({  
    content: `🎈 ${membro}, envie sua prova aqui 📸`  
  });  

  const botoes = new ActionRowBuilder().addComponents(  
    new ButtonBuilder()  
      .setCustomId(`evento_aprovar_${membro.id}_${pontos}`)  
      .setLabel('✅ Aprovar')  
      .setStyle(ButtonStyle.Success),  

    new ButtonBuilder()  
      .setCustomId(`evento_recusar_${membro.id}`)  
      .setLabel('❌ Recusar')  
      .setStyle(ButtonStyle.Danger)  
  );  

  await thread.send({  
    components: [botoes]  
  });  

  await interaction.editReply({  
    content: `✅ Evento criado: ${thread}`  
  });  
}  

// ===== BOTÕES =====  
if (interaction.isButton()) {  

  if (  
    !interaction.customId.startsWith('evento_aprovar') &&  
    !interaction.customId.startsWith('evento_recusar')  
  ) return;  

  const staffRole = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);  

  if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {  
    return interaction.reply({  
      content: '❌ Apenas staff pode usar isso.',  
      ephemeral: true  
    });  
  }  

  const thread = interaction.channel;  

  // RECUSAR  
  if (interaction.customId.startsWith('evento_recusar')) {  
    await interaction.reply('❌ Evento recusado.');  
    setTimeout(() => thread.delete().catch(() => {}), 2000);  
  }  

  // ✅ APROVAR (SALVANDO CERTO)
  if (interaction.customId.startsWith('evento_aprovar')) {

    console.log("📁 Salvando em:", DB_PATH);

    const partes = interaction.customId.split('_');
    const userId = partes[2];
    const pontos = parseInt(partes[3]);

    let db = {};

    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        db = raw ? JSON.parse(raw) : {};
      }
    } catch (err) {
      console.log("Erro lendo JSON, resetando:", err);
      db = {};
    }

    if (!db[userId]) db[userId] = 0;
    db[userId] += pontos;

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    console.log("💾 Dados salvos:", db); // 👈 ESSA LINHA É A NOVA

    await interaction.reply(`✅ Evento aprovado! (+${pontos} pontos)\n🏆 Total: ${db[userId]} pontos`);

    setTimeout(() => thread.delete().catch(() => {}), 2000);
  }  
}

});

};
