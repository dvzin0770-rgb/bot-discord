const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  async function pegarStock() {
    try {
      // API 1
      const res = await axios.get('https://api.bloxfruits.com/stock', { timeout: 5000 });
      if (res.data) return res.data;
    } catch {}

    try {
      // API 2 (fallback)
      const res = await axios.get('https://blox-fruits-api.onrender.com/stock', { timeout: 5000 });
      if (res.data) return res.data;
    } catch {}

    return null;
  }

  async function atualizarStock() {
    try {
      const canal = client.channels.cache.get('1485259856712568832');

      if (!canal) {
        console.log('❌ Canal não encontrado');
        return;
      }

      console.log('📤 Buscando stock...');

      const normalRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Normal ping');
      const mirageRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Mirage ping');

      const data = await pegarStock();

      if (!data) {
        console.log('❌ Nenhuma API respondeu');
        return;
      }

      // adapta formatos diferentes
      const normal = data.normal || data.stock || [];
      const mirage = data.mirage || data.mirageStock || [];
      const tempo = data.time || data.reset || 'Desconhecido';

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🛒 Blox Fruits Stock')
        .setDescription('Atualização automática do stock')
        .addFields(
          {
            name: '🍏 Normal',
            value: normal.length ? normal.join('\n') : 'Nenhuma',
            inline: true
          },
          {
            name: '🌌 Mirage',
            value: mirage.length ? mirage.join('\n') : 'Indisponível',
            inline: true
          },
          {
            name: '⏱️ Reset',
            value: tempo
          }
        )
        .setTimestamp();

      let ping = '';
      if (normal.length && normalRole) ping += `<@&${normalRole.id}> `;
      if (mirage.length && mirageRole) ping += `<@&${mirageRole.id}> `;

      await canal.send({
        content: ping || null,
        embeds: [embed]
      });

      console.log('✅ Stock enviado!');

    } catch (err) {
      console.log('Erro geral stock:', err.message);
    }
  }

  client.once('ready', () => {
    console.log('📦 Sistema de stock iniciado (multi API)');

    atualizarStock();

    setInterval(atualizarStock, 1000 * 60 * 5); // 5 min
  });

};
