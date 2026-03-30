const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const eco = require('./economia');

module.exports = (client) => {

// ================= CONFIG =================

const CANAL = '💬丨ɢᴇʀᴀʟ';
const TEMPO_EVENTO = 15 * 60 * 1000;
const INTERVALO = 20 * 60 * 1000;

let ativo = false;

// ================= EVENTOS =================

const eventos = [
  { nome: '💰 Tesouro', tipo: 'click', recompensa: 2000 },
  { nome: '⚔️ Guerra Naval', tipo: 'boss', vida: 5000, recompensa: 8000 },
  { nome: '🐉 Kraken', tipo: 'boss', vida: 8000, recompensa: 12000 },
  { nome: '🏝 Ilha', tipo: 'multi', recompensa: 3000 }
];

// ================= HELPERS =================

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function criarThread(canal) {
  return canal.threads.create({
    name: `evento-${Date.now()}`,
    type: ChannelType.PublicThread,
    autoArchiveDuration: 60
  });
}

// ================= EVENTO CLICK =================

async function eventoClick(thread, evento) {

  const embed = new EmbedBuilder()
    .setColor('#22c55e')
    .setTitle(evento.nome)
    .setDescription('Clique no botão para pegar!');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pegar')
      .setLabel('PEGAR')
      .setStyle(ButtonStyle.Success)
  );

  const msg = await thread.send({ embeds: [embed], components: [row] });

  const collector = msg.createMessageComponentCollector({ time: TEMPO_EVENTO });

  let ganhou = false;

  collector.on('collect', async (i) => {

    if (ganhou) return i.reply({ content: 'Já foi!', ephemeral: true });

    ganhou = true;

    eco.addMoney(i.user.id, evento.recompensa);

    await i.reply(`🏆 Você ganhou ${evento.recompensa}`);

    msg.edit({ components: [] });

    collector.stop();
  });

}

// ================= EVENTO BOSS =================

async function eventoBoss(thread, evento) {

  let vida = evento.vida;

  const embed = new EmbedBuilder()
    .setColor('#ef4444')
    .setTitle(evento.nome)
    .setDescription(`❤️ Vida: ${vida}`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('atacar')
      .setLabel('ATACAR')
      .setStyle(ButtonStyle.Danger)
  );

  const msg = await thread.send({ embeds: [embed], components: [row] });

  const players = new Map();

  const collector = msg.createMessageComponentCollector({ time: TEMPO_EVENTO });

  collector.on('collect', async (i) => {

    const dmg = Math.floor(Math.random() * 300) + 100;

    vida -= dmg;

    players.set(i.user.id, (players.get(i.user.id) || 0) + dmg);

    await i.reply({ content: `💥 ${dmg} de dano!`, ephemeral: true });

    embed.setDescription(`❤️ Vida: ${vida}`);
    msg.edit({ embeds: [embed] });

    if (vida <= 0) {
      collector.stop();

      let vencedor = null;
      let maior = 0;

      for (const [id, dano] of players) {
        if (dano > maior) {
          maior = dano;
          vencedor = id;
        }
      }

      if (vencedor) {
        eco.addMoney(vencedor, evento.recompensa);
        thread.send(`🏆 <@${vencedor}> deu mais dano e ganhou!`);
      }
    }

  });

}

// ================= EVENTO MULTI =================

async function eventoMulti(thread, evento) {

  const participantes = new Set();

  const embed = new EmbedBuilder()
    .setColor('#3b82f6')
    .setTitle(evento.nome)
    .setDescription('Digite **entrar**');

  await thread.send({ embeds: [embed] });

  const collector = thread.createMessageCollector({ time: TEMPO_EVENTO });

  collector.on('collect', (msg) => {

    if (msg.content === 'entrar') {
      participantes.add(msg.author.id);
    }

  });

  collector.on('end', () => {

    participantes.forEach(id => {
      eco.addMoney(id, evento.recompensa);
      thread.send(`💰 <@${id}> ganhou ${evento.recompensa}`);
    });

  });

}

// ================= CONTROLADOR =================

async function iniciarEvento(canal) {

  if (ativo) return;

  ativo = true;

  const evento = rand(eventos);

  let thread;

  try {
    thread = await criarThread(canal);
  } catch (err) {
    console.log(err);
    ativo = false;
    return;
  }

  if (evento.tipo === 'click') await eventoClick(thread, evento);
  if (evento.tipo === 'boss') await eventoBoss(thread, evento);
  if (evento.tipo === 'multi') await eventoMulti(thread, evento);

  setTimeout(() => {
    thread.delete().catch(()=>{});
    ativo = false;
  }, TEMPO_EVENTO + 5000);

}

// ================= LOOP =================

function loop(canal) {
  setInterval(() => {
    iniciarEvento(canal);
  }, INTERVALO);
}

// ================= READY =================

client.once('ready', () => {

  const guild = client.guilds.cache.first();
  if (!guild) return;

  const canal = guild.channels.cache.find(c => c.name === CANAL);
  if (!canal) return console.log('Canal não encontrado');

  loop(canal);

});

};
