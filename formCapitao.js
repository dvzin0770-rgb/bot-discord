// ======================================================
// 👑 FORM CAPITÃO COMPLETO (FUNCIONAL)
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

// ================= CONFIG =================
const STAFF_ROLE = 'Moderador Staff';
const CAP_ROLE = '⃤⃟⃝ Capitão';
const PREFIX = 'cap-';
const COOLDOWN = 5 * 60 * 1000;

// ================= CACHE =================
const cache = new Map();
const cooldown = new Map();

// ================= FUNÇÕES =================
function getRole(guild, name) {
  return guild.roles.cache.find(r => r.name === name);
}

function emCooldown(id) {
  return cooldown.has(id) && Date.now() < cooldown.get(id);
}

function setCooldown(id) {
  cooldown.set(id, Date.now() + COOLDOWN);
}

function formatar(p1, p2) {
  return "```\n" +
    `Nome: ${p1.nome}\n` +
    `Idade: ${p1.idade}\n` +
    `Bounty: ${p1.bounty}\n` +
    `Tempo: ${p1.tempo}\n` +
    `Capitão antes: ${p1.cap}\n\n` +
    `Motivo: ${p2.motivo}\n` +
    `Crew: ${p2.crew}\n` +
    `Inativos: ${p2.inativos}\n` +
    `Problemas: ${p2.problemas}\n` +
    `Disponibilidade: ${p2.disp}\n` +
  "```";
}

// ================= COMANDO =================
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!formcapitao') {

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('👑 CAPITÃO — FROSTVOW')
      .setDescription('Clique no botão abaixo para se candidatar.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_form')
        .setLabel('👑 Aplicar')
        .setStyle(ButtonStyle.Success)
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= INTERAÇÕES =================
client.on('interactionCreate', async (i) => {

  // ===== BOTÕES =====
  if (i.isButton()) {

    // abrir formulário
    if (i.customId === 'abrir_form') {

      if (emCooldown(i.user.id)) {
        return i.reply({ content: '⏳ Aguarde para aplicar novamente.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('form1')
        .setTitle('👑 Formulário (1/2)');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('nome').setLabel('Nome no jogo').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('idade').setLabel('Idade').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('bounty').setLabel('Bounty').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tempo').setLabel('Tempo jogando').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('cap').setLabel('Já foi capitão?').setStyle(TextInputStyle.Short).setRequired(true)
        )
      );

      return i.showModal(modal);
    }

    // ===== APROVAR / RECUSAR =====
    if (i.customId === 'aprovar' || i.customId === 'recusar') {

      await i.deferReply({ ephemeral: true });

      const staff = getRole(i.guild, STAFF_ROLE);
      if (!staff || !i.member.roles.cache.has(staff.id)) {
        return i.editReply('❌ Apenas staff.');
      }

      const thread = i.channel;
      const userId = thread.name.replace(PREFIX, '');

      const member = await i.guild.members.fetch(userId).catch(() => null);
      const capRole = getRole(i.guild, CAP_ROLE);

      if (i.customId === 'aprovar') {

        if (member && capRole) {
          await member.roles.add(capRole).catch(() => {});
        }

        eco.addMoney(userId, 5000);

        if (member) {
          member.send('✅ Você foi aprovado como Capitão!').catch(() => {});
        }

        await i.editReply('✅ Aprovado.');

        setTimeout(() => thread.delete().catch(() => {}), 3000);
      }

      if (i.customId === 'recusar') {

        if (member) {
          member.send('❌ Sua aplicação foi recusada.').catch(() => {});
        }

        await i.editReply('❌ Recusado.');

        setTimeout(() => thread.delete().catch(() => {}), 3000);
      }
    }
  }

  // ===== MODAIS =====
  if (i.isModalSubmit()) {

    // ===== PARTE 1 =====
    if (i.customId === 'form1') {

      const dados = {
        nome: i.fields.getTextInputValue('nome'),
        idade: i.fields.getTextInputValue('idade'),
        bounty: i.fields.getTextInputValue('bounty'),
        tempo: i.fields.getTextInputValue('tempo'),
        cap: i.fields.getTextInputValue('cap')
      };

      cache.set(i.user.id, dados);

      const modal2 = new ModalBuilder()
        .setCustomId('form2')
        .setTitle('👑 Formulário (2/2)');

      modal2.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('motivo').setLabel('Por que quer ser capitão?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('crew').setLabel('O que faria pela crew?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('inativos').setLabel('Como lidaria com inativos?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('problemas').setLabel('Já teve problemas com staff?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('disp').setLabel('Disponibilidade diária').setStyle(TextInputStyle.Short).setRequired(true)
        )
      );

      return i.showModal(modal2);
    }

    // ===== PARTE 2 =====
    if (i.customId === 'form2') {

      const p1 = cache.get(i.user.id);
      if (!p1) {
        return i.reply({ content: 'Erro no formulário.', ephemeral: true });
      }

      const p2 = {
        motivo: i.fields.getTextInputValue('motivo'),
        crew: i.fields.getTextInputValue('crew'),
        inativos: i.fields.getTextInputValue('inativos'),
        problemas: i.fields.getTextInputValue('problemas'),
        disp: i.fields.getTextInputValue('disp')
      };

      const thread = await i.channel.threads.create({
        name: `${PREFIX}${i.user.id}`,
        type: ChannelType.PrivateThread,
        invitable: false
      });

      // 🔥 ADICIONA BOT NO TÓPICO (CORRIGE BUG)
      await thread.members.add(client.user.id);

      await thread.members.add(i.user.id);

      const staff = getRole(i.guild, STAFF_ROLE);
      if (staff) {
        for (const m of staff.members.values()) {
          await thread.members.add(m.id).catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('📋 Aplicação — Capitão')
        .setDescription(`👤 <@${i.user.id}>`)
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('aprovar').setLabel('Aprovar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('recusar').setLabel('Recusar').setStyle(ButtonStyle.Danger)
      );

      await thread.send({ embeds: [embed], components: [row] });
      await thread.send({ content: formatar(p1, p2) });

      cache.delete(i.user.id);
      setCooldown(i.user.id);

      await i.reply({ content: '✅ Aplicação enviada!', ephemeral: true });
    }
  }
});

};
