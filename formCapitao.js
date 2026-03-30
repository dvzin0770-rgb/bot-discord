// ======================================================
// 👑 FORM CAPITÃO ULTRA COMPLETO (300+ LINHAS REAIS)
// ======================================================

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// ======================================================
// ⚙️ CONFIG
// ======================================================

const STAFF_ROLE = 'Moderador Staff';
const CAPITAO_ROLE = '⃤⃟⃝ Capitão';
const THREAD_PREFIX = 'capitao-';
const COOLDOWN = 5 * 60 * 1000;

// ======================================================
// 🧠 CACHE / CONTROLE
// ======================================================

const cache = new Map();
const cooldown = new Map();
const logs = [];

// ======================================================
// 🔧 FUNÇÕES AUXILIARES
// ======================================================

function getRole(guild, name) {
  return guild.roles.cache.find(r => r.name === name);
}

function log(msg) {
  console.log('[FORM]', msg);
  logs.push(msg);
}

function isOnCooldown(userId) {
  if (!cooldown.has(userId)) return false;
  return Date.now() < cooldown.get(userId);
}

function setCooldown(userId) {
  cooldown.set(userId, Date.now() + COOLDOWN);
}

function formatarAplicacao(p1, p2) {
  return "```\n" +
    `Nome: ${p1.nome}\n` +
    `Idade: ${p1.idade}\n` +
    `Bounty: ${p1.bounty}\n` +
    `Tempo: ${p1.tempo}\n` +
    `Já foi capitão: ${p1.cap}\n\n` +
    `Motivo: ${p2.motivo}\n` +
    `Crew: ${p2.crew}\n` +
    `Inativos: ${p2.inativos}\n` +
    `Problemas: ${p2.problemas}\n` +
    `Disponibilidade: ${p2.disp}\n` +
  "```";
}

function criarEmbedPainel() {
  return new EmbedBuilder()
    .setColor('#1e3a8a')
    .setTitle('👑 CAPITÃO — FROSTVOW')
    .setDescription('Clique abaixo para aplicar');
}

function criarBotaoPainel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_form')
      .setLabel('👑 Aplicar')
      .setStyle(ButtonStyle.Success)
  );
}

function criarBotoesStaff() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('aprovar_cap').setLabel('Aprovar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('recusar_cap').setLabel('Recusar').setStyle(ButtonStyle.Danger)
  );
}

function criarEmbedAplicacao(user, p1, p2) {
  return new EmbedBuilder()
    .setColor('#22c55e')
    .setTitle('📋 Aplicação')
    .setDescription(`👤 <@${user.id}>`)
    .addFields(
      { name: 'Nome', value: p1.nome },
      { name: 'Idade', value: p1.idade },
      { name: 'Bounty', value: p1.bounty },
      { name: 'Tempo', value: p1.tempo },
      { name: 'Capitão antes', value: p1.cap },
      { name: 'Motivo', value: p2.motivo },
      { name: 'Crew', value: p2.crew },
      { name: 'Inativos', value: p2.inativos },
      { name: 'Problemas', value: p2.problemas },
      { name: 'Disponibilidade', value: p2.disp }
    );
}

// ======================================================
// 📌 COMANDO
// ======================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!formcapitao') {
    log('Painel enviado');
    await message.channel.send({
      embeds: [criarEmbedPainel()],
      components: [criarBotaoPainel()]
    });
  }
});

// ======================================================
// 🔘 INTERAÇÕES
// ======================================================

client.on('interactionCreate', async (interaction) => {

  // ================= BOTÕES =================

  if (interaction.isButton()) {

    if (interaction.customId === 'abrir_form') {

      if (isOnCooldown(interaction.user.id)) {
        return interaction.reply({ content: '⏳ Aguarde.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('form1')
        .setTitle('Capitão 1/2');

      const campos = ['nome','idade','bounty','tempo','cap'];
      const labels = ['Nome','Idade','Bounty','Tempo','Já foi capitão?'];

      for (let i = 0; i < campos.length; i++) {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(campos[i])
              .setLabel(labels[i])
              .setStyle(TextInputStyle.Short)
          )
        );
      }

      return interaction.showModal(modal);
    }

    if (interaction.customId === 'aprovar_cap' || interaction.customId === 'recusar_cap') {

      await interaction.deferReply({ ephemeral: true });

      const staff = getRole(interaction.guild, STAFF_ROLE);
      if (!staff || !interaction.member.roles.cache.has(staff.id)) {
        return interaction.editReply('❌ Apenas staff');
      }

      const thread = interaction.channel;
      const userId = thread.name.replace(THREAD_PREFIX, '');
      const member = await interaction.guild.members.fetch(userId).catch(()=>null);
      const capRole = getRole(interaction.guild, CAPITAO_ROLE);

      if (interaction.customId === 'aprovar_cap') {

        if (member && capRole) {
          await member.roles.add(capRole).catch(()=>{});
        }

        eco.addMoney(userId, 5000);

        if (member) member.send('✅ Você virou Capitão!').catch(()=>{});

        await interaction.editReply('Aprovado');

        setTimeout(()=>thread.delete().catch(()=>{}),3000);
      }

      if (interaction.customId === 'recusar_cap') {

        eco.removeMoney(userId, 1000);

        if (member) member.send('❌ Recusado').catch(()=>{});

        await interaction.editReply('Recusado');

        setTimeout(()=>thread.delete().catch(()=>{}),3000);
      }
    }
  }

  // ================= MODAIS =================

  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'form1') {

      const dados = {
        nome: interaction.fields.getTextInputValue('nome'),
        idade: interaction.fields.getTextInputValue('idade'),
        bounty: interaction.fields.getTextInputValue('bounty'),
        tempo: interaction.fields.getTextInputValue('tempo'),
        cap: interaction.fields.getTextInputValue('cap')
      };

      cache.set(interaction.user.id, dados);

      const modal2 = new ModalBuilder()
        .setCustomId('form2')
        .setTitle('Capitão 2/2');

      const campos2 = ['motivo','crew','inativos','problemas','disp'];
      const labels2 = [
        'Por que quer ser capitão?',
        'O que faria pela crew?',
        'Como lidaria com inativos?',
        'Já teve problemas?',
        'Disponibilidade'
      ];

      for (let i = 0; i < campos2.length; i++) {
        modal2.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(campos2[i])
              .setLabel(labels2[i])
              .setStyle(TextInputStyle.Paragraph)
          )
        );
      }

      return interaction.showModal(modal2);
    }

    if (interaction.customId === 'form2') {

      const p1 = cache.get(interaction.user.id);
      if (!p1) return interaction.reply({ content: 'Erro', ephemeral: true });

      const p2 = {
        motivo: interaction.fields.getTextInputValue('motivo'),
        crew: interaction.fields.getTextInputValue('crew'),
        inativos: interaction.fields.getTextInputValue('inativos'),
        problemas: interaction.fields.getTextInputValue('problemas'),
        disp: interaction.fields.getTextInputValue('disp')
      };

      const thread = await interaction.channel.threads.create({
        name: `${THREAD_PREFIX}${interaction.user.id}`,
        type: ChannelType.PrivateThread,
        invitable: false
      });

      await thread.members.add(interaction.user.id);

      const staff = getRole(interaction.guild, STAFF_ROLE);
      if (staff) {
        for (const m of staff.members.values()) {
          await thread.members.add(m.id).catch(()=>{});
        }
      }

      const embed = criarEmbedAplicacao(interaction.user, p1, p2);
      const textoCopiavel = formatarAplicacao(p1, p2);

      await thread.send({ embeds: [embed], components: [criarBotoesStaff()] });
      await thread.send({ content: textoCopiavel });

      cache.delete(interaction.user.id);
      setCooldown(interaction.user.id);

      await interaction.reply({ content: '✅ Enviado!', ephemeral: true });
    }
  }
});

};
    
