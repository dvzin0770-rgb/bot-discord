const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  async function pegarStock() {
    try {
      const res = await axios.get('https://api.bloxfruits.com/stock', {
        timeout: 5000
      });
      return res.data;
    } catch {
      return null;
    }
  }

  async function atualizarStock() {
    try {

      const canal = client.channels.cache.find(c => c.name.includes('stock'));
      if (!canal) return;

      const normalRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Normal ping');
      const mirageRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Mirage ping');

      // 🔁 tenta até 3 vezes
      let data = null;
      for (let i = 0; i < 3; i++) {
        data = await pegarStock();
        if (data) break;
      }

      if (!data) {
        console.log('❌ API morreu de vez, tentando depois...');
        return;
      }

      const normal = Array.isArray(data.normal) ? data.normal : [];
      const mirage = Array.isArray(data.mirage) ? data.mirage : [];
      const tempo = data.time || 'Desconhecido';

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🛒 Blox Fruits Stock')
        .setDescription('Atualização automática do stock:')
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

    } catch (err) {
      console.log('Erro geral stock:', err.message);
    }
  }

  client.once('ready', () => {
    console.log('📦 Sistema de stock iniciado');

    atualizarStock();

    setInterval(atualizarStock, 1000 * 30);
  });

};
