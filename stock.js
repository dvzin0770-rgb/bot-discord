const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  async function pegarStock() {
    try {
      const res = await axios.get('https://fruityblox.com/stock', {
        timeout: 10000
      });

      const html = res.data;

      // 🔎 lista completa de frutas
      const frutas = [
        "Rocket","Spin","Chop","Spring","Bomb","Smoke","Spike",
        "Flame","Falcon","Ice","Sand","Dark","Diamond","Light",
        "Rubber","Barrier","Ghost","Magma","Quake","Buddha",
        "Love","Spider","Sound","Phoenix","Portal","Rumble",
        "Pain","Blizzard","Gravity","Dough","Shadow","Venom",
        "Control","Spirit","Dragon","Leopard","Kitsune"
      ];

      let normal = [];

      frutas.forEach(fruta => {
        if (html.includes(fruta)) {
          normal.push(fruta);
        }
      });

      return { normal, mirage: [] };

    } catch (err) {
      console.log('❌ Erro no scraping:', err.message);
      return null;
    }
  }

  async function atualizarStock() {
    try {
      const canal = client.channels.cache.get('1485259856712568832');

      if (!canal) {
        console.log('❌ Canal não encontrado');
        return;
      }

      console.log('📤 Pegando stock via scraping...');

      const normalRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Normal ping');
      const mirageRole = canal.guild.roles.cache.find(r => r.name === '⃤⃟⃝Mirage ping');

      const data = await pegarStock();

      if (!data) {
        console.log('❌ Falha no scraping');
        return;
      }

      const { normal, mirage } = data;

      if (!normal.length) {
        console.log('⚠️ Nenhuma fruta encontrada');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🛒 Blox Fruits Stock')
        .setDescription('Atualização automática (scraping)')
        .addFields(
          {
            name: '🍏 Normal',
            value: normal.join('\n'),
            inline: true
          },
          {
            name: '🌌 Mirage',
            value: 'Indisponível',
            inline: true
          }
        )
        .setTimestamp();

      let ping = '';
      if (normal.length && normalRole) ping += `<@&${normalRole.id}> `;
      if (mirageRole) ping += `<@&${mirageRole.id}> `;

      await canal.send({
        content: ping || null,
        embeds: [embed]
      });

      console.log('✅ Stock enviado via scraping!');

    } catch (err) {
      console.log('Erro geral stock:', err.message);
    }
  }

  client.once('ready', () => {
    console.log('📦 Sistema de stock iniciado (SCRAPING FIX)');

    atualizarStock();

    setInterval(atualizarStock, 1000 * 60 * 5);
  });

};
