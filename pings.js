const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  const CANAL_PAINEL = '🔴丨pɪɴɢs';

  const pings = [
    { emoji: '🔴', name: '𝗣𝗜𝗡𝗚𝗦', role: 'ping-geral', desc: 'Receba notificações gerais', color: 'Red' },
    { emoji: '🎉', name: '𝗘𝗩𝗘𝗡𝗧𝗢𝗦', role: 'ping-eventos', desc: 'Notificações de eventos e sorteios', color: 'Purple' },
    { emoji: '🌊', name: '𝗘𝗩𝗘𝗡𝗧𝗢-𝗗𝗢-𝗠𝗔𝗥', role: 'ping-evento-do-mar', desc: 'Avisos de evento do mar', color: 'Blue' },
    { emoji: '🐉', name: '𝗥𝗔𝗜𝗗', role: 'ping-raid', desc: 'Avisos de Raid', color: 'DarkRed' },
    { emoji: '🥊', name: '𝗣𝗩𝗣', role: 'ping-pvp', desc: 'Notificações de PvP', color: 'Green' },
    { emoji: '🔎', name: '𝗕𝗨𝗜𝗟𝗗𝗦', role: 'ping-builds', desc: 'Novas builds e combos', color: 'Gold' },
    { emoji: '❓', name: '𝗩𝗔𝗟𝗘-𝗢𝗨-𝗡𝗔̃𝗢-𝗩𝗔𝗟𝗘', role: 'ping-vale-ou-nao-vale', desc: 'Avisos de vale ou não vale', color: 'Orange' },
    { emoji: '🔄', name: '𝗧𝗥𝗔𝗗𝗘', role: 'ping-trade', desc: 'Notificações de trocas', color: 'Grey' },
    { emoji: '🏝️', name: '𝗠𝗜𝗥𝗔𝗚𝗘', role: 'ping-mirage', desc: 'Avisos da ilha Mirage', color: 'Aqua' },
    { emoji: '🌋', name: '𝗩𝗨𝗟𝗖𝗔̃𝗢', role: 'ping-vulcao', desc: 'Eventos do vulcão', color: 'DarkOrange' },
    { emoji: '⚔️', name: '𝗕𝗢𝗦𝗦', role: 'ping-boss', desc: 'Spawn de bosses', color: 'DarkGold' },
    { emoji: '💰', name: '𝗙𝗥𝗨𝗧𝗔𝗦', role: 'ping-frutas', desc: 'Avisos de frutas', color: 'Yellow' },
    { emoji: '🧭', name: '𝗖𝗔𝗖̧𝗔', role: 'ping-caca', desc: 'Caça a players / bounty', color: 'Cyan' },
    { emoji: '🏆', name: '𝗧𝗢𝗥𝗡𝗘𝗜𝗢', role: 'ping-torneio', desc: 'Eventos competitivos', color: 'Gold' },
    { emoji: '🎁', name: '𝗚𝗜𝗩𝗘𝗔𝗪𝗔𝗬', role: 'ping-giveaway', desc: 'Sorteios do servidor', color: 'Pink' }
  ];

  let painelMsg;

  client.once('ready', async () => {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const canal = guild.channels.cache.find(c => c.name === CANAL_PAINEL);
      if (!canal) return console.log('Canal de pings não encontrado');

      const mensagens = await canal.messages.fetch({ limit: 10 });

      const existente = mensagens.find(m =>
        m.author.id === client.user.id &&
        m.embeds.length > 0 &&
        m.embeds[0].title?.includes('Painel de Pings')
      );

      if (existente) {
        painelMsg = existente;
        console.log('⚠️ Painel já existe');
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

      console.log('✅ Painel criado');

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
      if (reaction.partial) await reaction.fetch();
      if (user.bot) return;

      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const member = reaction.message.guild.members.cache.get(user.id);
      const role = await getOrCreateRole(reaction.message.guild, ping.role, ping.color);

      await member.roles.add(role);
    } catch (err) {
      console.error(err);
    }
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      if (reaction.partial) await reaction.fetch();
      if (user.bot) return;

      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const member = reaction.message.guild.members.cache.get(user.id);
      const role = reaction.message.guild.roles.cache.find(r => r.name === ping.role);

      if (role) await member.roles.remove(role);
    } catch (err) {
      console.error(err);
    }
  });

};
