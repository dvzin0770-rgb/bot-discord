const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  async function atualizarStock() {
    try {

      const canal = client.channels.cache.find(c => c.name === '🛒丨ꜱᴛᴏᴄᴋ');
      if (!canal) return;

      // ===== CARGOS =====
      const normalRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Normal ping');
      const mirageRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Mirage ping');

      // ===== API COM PROTEÇÃO =====
      const res = await axios.get('https://api.bloxfruits.com/stock', {
        timeout: 5000
      }).catch(() => null);

      if (!res || !res.data) {
        console.log('API não respondeu, ignorando...');
        return;
      }

      const data = res.data;

      const normal = Array.isArray(data.normal) ? data.normal : [];
      const mirage = Array.isArray(data.mirage) ? data.mirage : [];
      const tempo = data.time || 'Desconhecido';

      // ===== EMBED =====
      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🛒 Blox Fruits Stock Atualizado')
        .setDescription('Confira abaixo as frutas disponíveis agora:')
        .addFields(
          {
            name: '🍏 Estoque Normal',
            value: normal.length
              ? `\`\`\`\n${normal.join('\n')}\n\`\`\``
              : '```Nenhuma fruta```',
            inline: true
          },
          {
            name: '🌌 Estoque Mirage',
            value: mirage.length
              ? `\`\`\`\n${mirage.join('\n')}\n\`\`\``
              : '```Indisponível```',
            inline: true
          },
          {
            name: '⏱️ Próximo Reset',
            value: `\`${tempo}\``
          }
        )
        .setFooter({ text: 'Sistema automático • Blox Fruits' })
        .setTimestamp();

      // ===== PING =====
      let pingMensagem = '';

      if (normal.length && normalRole) {
        pingMensagem += `<@&${normalRole.id}> `;
      }

      if (mirage.length && mirageRole) {
        pingMensagem += `<@&${mirageRole.id}> `;
      }

      // ===== ENVIO =====
      await canal.send({
        content: pingMensagem || null,
        embeds: [embed]
      });

    } catch (err) {
      console.log('Erro no stock (seguro):', err.message);
    }
  }

  // ===== INICIAR =====
  client.once('ready', () => {
    console.log('📦 Sistema de stock iniciado');

    atualizarStock();

    setInterval(() => {
      atualizarStock();
    }, 1000 * 60 * 10); // 10 minutos
  });

};
