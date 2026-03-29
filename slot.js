const {
  EmbedBuilder
} = require('discord.js');

const eco = require('./economia');

// =============================
// 🧠 SISTEMA GLOBAL
// =============================
const cooldown = new Map();
const historico = new Map();
const streaks = new Map();

// =============================
// ⚙️ CONFIG
// =============================
const COOLDOWN_TEMPO = 5000;
const MAX_HIST = 10;

// =============================
// 🎲 SORTEIO
// =============================
function sortear() {
  return Math.random() < 0.5 ? 'cara' : 'coroa';
}

// =============================
// 📊 HISTÓRICO
// =============================
function addHistorico(id, resultado) {

  if (!historico.has(id)) {
    historico.set(id, []);
  }

  const lista = historico.get(id);

  lista.push(resultado);

  if (lista.length > MAX_HIST) {
    lista.shift();
  }

}

// =============================
// 🔥 STREAK
// =============================
function atualizarStreak(id, ganhou) {

  if (!streaks.has(id)) {
    streaks.set(id, { win: 0, lose: 0 });
  }

  const data = streaks.get(id);

  if (ganhou) {
    data.win += 1;
    data.lose = 0;
  } else {
    data.lose += 1;
    data.win = 0;
  }

  return data;
}

// =============================
// 🎨 EMBED
// =============================
function criarEmbed(user, escolha, resultado, aposta, ganho, saldo, streak, hist) {

  const ganhou = escolha === resultado;

  return new EmbedBuilder()
    .setColor(ganhou ? '#22c55e' : '#ef4444')
    .setTitle('🪙 COINFLIP INSANO')
    .setDescription(
      `👤 **${user}**\n\n` +
      `🧠 Escolha: **${escolha}**\n` +
      `🎲 Resultado: **${resultado}**\n\n` +
      `💸 Aposta: **${aposta}**\n` +
      `💰 Ganho: **${ganho}**\n` +
      `🏦 Saldo: **${saldo}**\n\n` +
      `🔥 Streak Win: **${streak.win}**\n` +
      `💀 Streak Lose: **${streak.lose}**\n\n` +
      `📜 Histórico: ${hist.join(' | ') || 'Nenhum'}`
    )
    .setFooter({ text: ganhou ? 'Você ganhou!' : 'Você perdeu!' });
}

// =============================
// 🎮 COMANDO
// =============================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith('!coinflip')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const escolha = args[2]?.toLowerCase();
    const id = message.author.id;

    // =============================
    // ⏳ COOLDOWN
    // =============================
    const agora = Date.now();

    if (cooldown.has(id)) {
      const tempo = cooldown.get(id);

      if (agora - tempo < COOLDOWN_TEMPO) {
        return message.reply('⏳ Calma aí...');
      }
    }

    cooldown.set(id, agora);

    // =============================
    // ❌ VALIDAÇÕES
    // =============================
    if (!aposta || aposta <= 0) {
      return message.reply('❌ Valor inválido.');
    }

    if (!['cara', 'coroa'].includes(escolha)) {
      return message.reply('❌ Escolha cara ou coroa.');
    }

    const saldo = eco.getSaldo(id);

    if (aposta > saldo) {
      return message.reply(
        `💸 Seu saldo é **${saldo}**.\nNão força não 🤨`
      );
    }

    // =============================
    // 💸 REMOVE
    // =============================
    eco.removeMoney(id, aposta);

    // =============================
    // 🎬 ANIMAÇÃO
    // =============================
    const msg = await message.reply('🪙 Girando...');

    const anim = ['🪙', '💿', '🔄', '🪙'];

    for (let i = 0; i < anim.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      await msg.edit(`🎲 ${anim[i]}`);
    }

    // =============================
    // 🎲 RESULTADO
    // =============================
    const resultado = sortear();
    const ganhou = resultado === escolha;

    let ganho = 0;

    if (ganhou) {
      ganho = aposta * 2;

      // bônus streak
      const st = streaks.get(id);
      if (st && st.win >= 3) {
        ganho += Math.floor(aposta * 0.5);
      }

      eco.addMoney(id, ganho);
    }

    // =============================
    // 📊 ATUALIZA
    // =============================
    addHistorico(id, resultado);

    const streak = atualizarStreak(id, ganhou);
    const hist = historico.get(id);

    const saldoFinal = eco.getSaldo(id);

    // =============================
    // 🎨 RESULTADO
    // =============================
    const embed = criarEmbed(
      message.author.username,
      escolha,
      resultado,
      aposta,
      ganho,
      saldoFinal,
      streak,
      hist
    );

    await msg.edit({
      content: '',
      embeds: [embed]
    });

  });

};
