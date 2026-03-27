const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  const CANAL_PAINEL = '🔴丨pɪɴɢs';

  // lista de pings inicial
  const pings = [
    { emoji: '🔴', name: '𝗣𝗜𝗡𝗚𝗦', role: 'ping geral', desc: 'Receba notificações gerais', color: 'Red' },
    { emoji: '🎉', name: '𝗘𝗩𝗘𝗡𝗧𝗢𝗦', role: 'ping eventos', desc: 'Notificações de eventos e sorteios', color: 'Purple' }
    // você pode adicionar outros iniciais
  ];

  let painelMsg; // mensagem do painel

  client.on('ready', async () => {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return console.log('Nenhuma guild encontrada');

      const canais = await guild.channels.fetch();
      const canal = canais.find(c => c.name === CANAL_PAINEL);
      if (!canal) return console.log(`Canal "${CANAL_PAINEL}" não encontrado`);

      // cria embed
      const embed = new EmbedBuilder()
        .setTitle('🎨 Painel de Pings')
        .setDescription(pings.map(p => `${p.emoji} │ ${p.name} → ${p.desc}`).join('\n'))
        .setColor('#8A2BE2');

      if (!painelMsg) {
        painelMsg = await canal.send({ embeds: [embed] });
        for (const p of pings) await painelMsg.react(p.emoji);
        console.log('📌 Painel de pings enviado!');
      }

    } catch (err) {
      console.error('Erro ao enviar painel de pings:', err);
    }
  });

  // função para criar ou pegar cargo
  async function getOrCreateRole(guild, roleName, color) {
    let role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
      role = await guild.roles.create({
        name: roleName,
        color: color,
        reason: 'Cargo automático de ping'
      });
    }
    return role;
  }

  // dar cargo ao reagir
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;
      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);
      const role = await getOrCreateRole(guild, ping.role, ping.color);

      await member.roles.add(role);
    } catch (err) {
      console.error('Erro ao adicionar cargo:', err);
    }
  });

  // remover cargo ao remover reação
  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      if (user.bot) return;
      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);
      const role = guild.roles.cache.find(r => r.name === ping.role);
      if (!role) return;

      await member.roles.remove(role);
    } catch (err) {
      console.error('Erro ao remover cargo:', err);
    }
  });

  // ===== Comando dinâmico !addping =====
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!addping')) return;

    // comando: !addping <emoji> <nome do cargo> <cor> <descrição>
    const args = message.content.split(' ').slice(1);
    if (args.length < 4) return message.reply('❌ Uso: !addping <emoji> <nome do cargo> <cor> <descrição>');

    const [emoji, ...rest] = args;
    const roleName = rest[0];
    const color = rest[1];
    const desc = rest.slice(2).join(' ');

    const guild = message.guild;

    try {
      const role = await getOrCreateRole(guild, roleName, color);

      // adiciona no array de pings
      pings.push({ emoji, name: roleName, role: roleName, desc, color });

      // atualiza o embed
      const canal = guild.channels.cache.find(c => c.name === CANAL_PAINEL);
      if (!canal || !painelMsg) return;

      const embed = new EmbedBuilder()
        .setTitle('🎨 Painel de Pings')
        .setDescription(pings.map(p => `${p.emoji} │ ${p.name} → ${p.desc}`).join('\n'))
        .setColor('#8A2BE2');

      await painelMsg.edit({ embeds: [embed] });
      await painelMsg.react(emoji);

      message.reply(`✅ Ping "${roleName}" adicionado com sucesso!`);
    } catch (err) {
      console.error('Erro ao adicionar novo ping:', err);
      message.reply('❌ Erro ao adicionar o ping.');
    }
  });

};
