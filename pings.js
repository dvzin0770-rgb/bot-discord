const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const CANAL_PAINEL = '🔴丨𝗣𝗜𝗡𝗚𝗦'; // canal já criado no servidor

  // lista de pings com emoji, nome estilizado, cargo e descrição
  const pings = [
    { emoji: '🔴', name: '𝗣𝗜𝗡𝗚𝗦', role: 'ping geral', desc: 'Receba notificações gerais' },
    { emoji: '🎉', name: '𝗘𝗩𝗘𝗡𝗧𝗢𝗦', role: 'ping eventos', desc: 'Notificações de eventos e sorteios' },
    { emoji: '🐉', name: '𝗥𝗔𝗜𝗗', role: 'ping raid', desc: 'Ping para avisos de Raid' },
    { emoji: '🌊', name: '𝗘𝗩𝗘𝗡𝗧𝗢-𝗗𝗢-𝗠𝗔𝗥', role: 'ping evento mar', desc: 'Avisos de evento do mar' },
    { emoji: '🥊', name: '𝗣𝗩𝗣', role: 'ping pvp', desc: 'Notificações de PvP' },
    { emoji: '🔎', name: '𝗠𝗜𝗡𝗛𝗔-𝗕𝗨𝗜𝗟𝗗-𝗘-𝗖𝗢𝗠𝗕𝗢𝗦', role: 'ping build', desc: 'Novas builds e combos' },
    { emoji: '❗❓', name: '𝗩𝗔𝗟𝗘-𝗢𝗨-𝗡𝗔̃𝗢-𝗩𝗔𝗟𝗘', role: 'ping vale ou não vale', desc: 'Avisos de vale ou não vale' }
  ];

  // cria painel no ready
  client.on('ready', async () => {
    try {
      const canal = client.channels.cache.find(c => c.name === CANAL_PAINEL);
      if (!canal) return console.log(`Canal "${CANAL_PAINEL}" não encontrado`);

      const embed = new EmbedBuilder()
        .setTitle('🎨 Painel de Pings')
        .setDescription(pings.map(p => `${p.emoji} │ ${p.name} → ${p.desc}`).join('\n'))
        .setColor('#8A2BE2');

      const msg = await canal.send({ embeds: [embed] });
      for (const p of pings) await msg.react(p.emoji);

      console.log('📌 Painel de pings enviado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar painel de pings:', err);
    }
  });

  // dar cargo ao reagir
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;
      const ping = pings.find(p => p.emoji === reaction.emoji.name);
      if (!ping) return;

      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);
      let role = guild.roles.cache.find(r => r.name === ping.role);
      if (!role) {
        role = await guild.roles.create({ name: ping.role, reason: 'Cargo automático de ping' });
      }

      await member.roles.add(role);
    } catch (err) {
      console.error('Erro ao adicionar cargo:', err);
    }
  });

  // remover cargo ao tirar reação
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
};
