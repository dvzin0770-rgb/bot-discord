const {
  EmbedBuilder
} = require('discord.js');

const eco = require('./economia');

// ==============================
// 🧠 SISTEMA GLOBAL
// ==============================
const cooldown = new Map();
const historicoGlobal = [];

// ==============================
// 🎯 CONFIG
// ==============================
const COOLDOWN = 5000;
const MAX_HIST = 15;

// ==============================
// 🎡 NUMEROS DA ROLETA
// ==============================
const vermelhos = [
  1,3,5,7,9,12,14,16,18,19,
  21,23,25,27,30,32,34,36
];

const pretos = [
  2,4,6,8,10,11,13,15,17,20,
  22,24,26,28,29,31,33,35
];

// ==============================
// 🎨 COR
// ==============================
function getCor(num) {
  if (num === 0) return 'verde';
  if (vermelhos.includes(num)) return 'vermelho';
  return 'preto';
}

// ==============================
// 🎲 GIRAR ROLETA
// ==============================
function girar() {
  return Math.floor(Math.random() * 37);
}

// ==============================
// 📊 HISTÓRICO
// ==============================
function addHist(num) {
  historicoGlobal.push(num);
  if (historicoGlobal.length > MAX_HIST) {
    historicoGlobal.shift();
  }
}

// ==============================
// 💰 CALCULAR GANHO
// ==============================
function calcular(aposta, tipo, valor, resultado, cor) {

  let ganho = 0;

  // número exato
  if (tipo === 'numero') {
    if (Number(valor) === resultado) {
      ganho = aposta * 35;
    }
  }

  // cor
  if (tipo === 'cor') {
    if (valor === cor) {
      ganho = aposta * 2;
    }
  }

  // par/impar
  if (tipo === 'paridade') {
    if (resultado !== 0) {
      if (valor === 'par' && resultado % 2 === 0) ganho = aposta * 2;
      if (valor === 'impar' && resultado % 2 !== 0) ganho = aposta * 2;
    }
  }

  // alto/baixo
  if (tipo === 'range') {
    if (valor === 'alto' && resultado >= 19) ganho = aposta * 2;
    if (valor === 'baixo' && resultado >= 1 && resultado <= 18) ganho = aposta * 2;
  }

  return ganho;
}

// ==============================
// 🎨 EMBED
// ==============================
function criarEmbed(user, aposta, tipo, valor, resultado, cor, ganho, saldo) {

  const ganhou = ganho > 0;

  return new EmbedBuilder()
    .setColor(ganhou ? '#22c55e' : '#ef4444')
    .setTitle('🎡 ROLETA INSANA — FROSTVOW')
    .setDescription(
      `👤 ${user}\n\n` +
      `🎯 Aposta: **${tipo} (${valor})**\n` +
      `💸 Valor: **${aposta}**\n\n` +
      `🎡 Resultado: **${resultado} (${cor})**\n\n` +
      `💰 Ganho: **${ganho}**\n` +
      `🏦 Saldo: **${saldo}**\n\n` +
      `📜 Histórico: ${historicoGlobal.join(', ')}`
    )
    .setFooter({ text: ganhou ? 'Você ganhou!' : 'Você perdeu!' });
}

// ==============================
// 🎮 COMANDO
// ==============================
module.exports = (client) => {

  client.on('messageCreate', async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith('!roleta')) return;

    const args = message.content.split(' ');
    const aposta = Number(args[1]);
    const tipo = args[2]?.toLowerCase();
    const valor = args[3]?.toLowerCase();
    const id = message.author.id;

    // ==============================
    // COOLDOWN
    // ==============================
    const agora = Date.now();

    if (cooldown.has(id)) {
      if (agora - cooldown.get(id) < COOLDOWN) {
        return message.reply('⏳ Aguarde...');
      }
    }

    cooldown.set(id, agora);

    // ==============================
    // VALIDAÇÃO
    // ==============================
    if (!aposta || aposta <= 0) {
      return message.reply('❌ Aposta inválida.');
    }

    const saldo = eco.getSaldo(id);

    if (aposta > saldo) {
      return message.reply(`💸 Seu saldo: ${saldo}`);
    }

    if (!tipo) {
      return message.reply(
        '❌ Tipos: numero | cor | paridade | range'
      );
    }

    // validações específicas
    if (tipo === 'numero') {
      if (isNaN(valor) || valor < 0 || valor > 36) {
        return message.reply('❌ Número de 0 a 36.');
      }
    }

    if (tipo === 'cor') {
      if (!['vermelho', 'preto'].includes(valor)) {
        return message.reply('❌ Use vermelho ou preto.');
      }
    }

    if (tipo === 'paridade') {
      if (!['par', 'impar'].includes(valor)) {
        return message.reply('❌ Use par ou impar.');
      }
    }

    if (tipo === 'range') {
      if (!['alto', 'baixo'].includes(valor)) {
        return message.reply('❌ Use alto ou baixo.');
      }
    }

    // ==============================
    // REMOVE DINHEIRO
    // ==============================
    eco.removeMoney(id, aposta);

    // ==============================
    // ANIMAÇÃO
    // ==============================
    const msg = await message.reply('🎡 Girando...');

    const frames = ['🔴','⚫','🟢','⚫','🔴'];

    for (let f of frames) {
      await new Promise(r => setTimeout(r, 400));
      await msg.edit(`🎡 ${f}`);
    }

    // ==============================
    // RESULTADO
    // ==============================
    const numero = girar();
    const cor = getCor(numero);

    addHist(numero);

    const ganho = calcular(aposta, tipo, valor, numero, cor);

    if (ganho > 0) {
      eco.addMoney(id, ganho);
    }

    const saldoFinal = eco.getSaldo(id);

    // ==============================
    // EMBED FINAL
    // ==============================
    const embed = criarEmbed(
      message.author.username,
      aposta,
      tipo,
      valor,
      numero,
      cor,
      ganho,
      saldoFinal
    );

    await msg.edit({
      content: '',
      embeds: [embed]
    });

  });

};
