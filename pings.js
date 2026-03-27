const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  const CANAL_PAINEL = '🔴丨pɪɴɢs';

  const pings = [
    { emoji: '🔴', name: '𝗣𝗜𝗡𝗚𝗦', role: 'ping geral', desc: 'Receba notificações gerais', color: 'Red' },
    { emoji: '🎉', name: '𝗘𝗩𝗘𝗡𝗧𝗢𝗦', role: 'ping eventos', desc: 'Notificações de eventos e sorteios', color: 'Purple' }
  ];

  let painelMsg;

  client.on('ready', async () => {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const canal = guild.channels.cache.find(c => c.name === CANAL_PAINEL);
      if (!canal) return console.log('Canal de pings não encontrado');

      const mensagens = await canal.messages.fetch({ limit: 10 });

      // 🔥 VERIFICA SE JÁ EXISTE PAINEL
      const existente = mensagens.find(m =>
        m.author.id === client.user.id &&
        m.embeds.length > 0 &&
        m.embeds[0].title?.includes('Painel de Pings')
      );

      if (existente) {
        painelMsg = existente;
        console.log('⚠️ Painel já existe, não vou criar outro.');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎨 Painel de Pings')
        .setDescription(pings.map(p => `${p.emoji} │ ${p.name} → ${p.desc}`).join('\n'))
        .setColor('#8A2BE2');

      painelMsg = await canal.send({ embeds: [embed] });

      for (const p of pings) {
        await painelMsg.react(p.emoji);
      }

      console.log('✅ Painel criado com sucesso');

    } catch (err) {
      console.error(err);
    }
  });

  async function getOrCreateRole(guild, roleName, color) {
    let role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
      role = await guild.roles.create({
        name: roleName,
        color: color,
        reason: 'Cargo de ping automático'
      });
    }
    return role;
  }

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const member = reaction.message.guild.members.cache.get(user.id);
      const role = await getOrCreateRole(reaction.message.guild, ping.role, ping.color);

      await member.roles.add(role);
    } catch {}
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      if (user.bot) return;

      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const member = reaction.message.guild.members.cache.get(user.id);
      const role = reaction.message.guild.roles.cache.find(r => r.name === ping.role);

      if (role) await member.roles.remove(role);
    } catch {}
  });

  // ===== COMANDO =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!addping')) return;

    const args = message.content.split(' ').slice(1);
    if (args.length < 4) {
      return message.reply('❌ Uso: !addping <emoji> <nome> <cor> <descrição>');
    }

    const emoji = args[0];
    const roleName = args[1];
    const color = args[2];
    const desc = args.slice(3).join(' ');

    try {
      await getOrCreateRole(message.guild, roleName, color);

      pings.push({ emoji, name: roleName, role: roleName, desc, color });

      const embed = new EmbedBuilder()
        .setTitle('🎨 Painel de Pings')
        .setDescription(pings.map(p => `${p.emoji} │ ${p.name} → ${p.desc}`).join('\n'))
        .setColor('#8A2BE2');

      await painelMsg.edit({ embeds: [embed] });
      await painelMsg.react(emoji);

      message.reply(`✅ Ping "${roleName}" adicionado!`);

    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao adicionar ping.');
    }
  });

};
