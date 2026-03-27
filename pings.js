const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  const CANAL_PAINEL = '🔴丨pɪɴɢs';

  const pings = [
    { emoji: '🔴', role: '⃤⃟⃝Ping-Geral', desc: 'Receba notificações gerais' },
    { emoji: '🎉', role: '⃤⃟⃝Ping-Eventos', desc: 'Notificações de eventos e sorteios' },
    { emoji: '🌊', role: '⃤⃟⃝Ping-Evento-do-Mar', desc: 'Avisos de evento do mar' },
    { emoji: '🐉', role: '⃤⃟⃝Ping-Raid', desc: 'Avisos de Raid' },
    { emoji: '🥊', role: '⃤⃟⃝Ping-PvP', desc: 'Notificações de PvP' },
    { emoji: '🔎', role: '⃤⃟⃝Ping-Builds', desc: 'Novas builds e combos' },
    { emoji: '❓', role: '⃤⃟⃝Ping-Vale-ou-Não-Vale', desc: 'Avisos de vale ou não vale' },
    { emoji: '🔄', role: '⃤⃟⃝Ping-Trade', desc: 'Notificações de trocas' },
    { emoji: '🏝️', role: '⃤⃟⃝Ping-Mirage', desc: 'Avisos da ilha Mirage' },
    { emoji: '🌋', role: '⃤⃟⃝Ping-Vulcão', desc: 'Eventos do vulcão' },
    { emoji: '⚔️', role: '⃤⃟⃝Ping-Boss', desc: 'Spawn de bosses' },
    { emoji: '💰', role: '⃤⃟⃝Ping-Frutas', desc: 'Avisos de frutas' },
    { emoji: '🧭', role: '⃤⃟⃝Ping-Caça', desc: 'Caça a players / bounty' },
    { emoji: '🏆', role: '⃤⃟⃝Ping-Torneio', desc: 'Eventos competitivos' },
    { emoji: '🎁', role: '⃤⃟⃝Ping-Giveaway', desc: 'Sorteios do servidor' }
  ];

  let painelMsg;

  client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const canal = guild.channels.cache.find(c => c.name === CANAL_PAINEL);
    if (!canal) return console.log('Canal não encontrado');

    const mensagens = await canal.messages.fetch({ limit: 10 });

    const existente = mensagens.find(m =>
      m.author.id === client.user.id &&
      m.embeds[0]?.title?.includes('Painel')
    );

    if (existente) {
      painelMsg = existente;
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎨 Painel de Pings')
      .setDescription(
        pings.map(p => `${p.emoji} │ ${p.role} → ${p.desc}`).join('\n')
      )
      .setColor('#8A2BE2');

    painelMsg = await canal.send({ embeds: [embed] });

    for (const p of pings) {
      await painelMsg.react(p.emoji);
    }
  });

  // DAR CARGO
  client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;

    const ping = pings.find(p => p.emoji === reaction.emoji.name);
    if (!ping) return;

    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.find(r => r.name === ping.role);

    if (!role) return;

    await member.roles.add(role);
  });

  // REMOVER CARGO
  client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;

    const ping = pings.find(p => p.emoji === reaction.emoji.name);
    if (!ping) return;

    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.find(r => r.name === ping.role);

    if (!role) return;

    await member.roles.remove(role);
  });

};
