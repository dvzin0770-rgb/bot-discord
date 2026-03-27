const axios = require('axios');
const cheerio = require('cheerio');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  async function pegarStock() {
    try {
      const res = await axios.get('https://fruityblox.com/stock', {
        timeout: 10000
      });

      const $ = cheerio.load(res.data);

      let normal = [];
      let mirage = [];

      // 🔎 pega nomes das frutas (site pode mudar, mas esse funciona hoje)
      $('.stock-item').each((i, el) => {
        const nome = $(el).find('.item-name').text().trim();
        if (nome) normal.push(nome);
      });

      $('.mirage-item').each((i, el) => {
        const nome = $(el).find('.item-name').text().trim();
        if (nome) mirage.push(nome);
      });

      return { normal, mirage };

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

      if (!normal.length && !mirage.length) {
        console.log('⚠️ Nada encontrado (site pode ter mudado)');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🛒 Blox Fruits Stock')
        .setDescription('Atualização automática (scraping)')
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

      console.log('✅ Stock enviado via scraping!');

    } catch (err) {
      console.log('Erro geral stock:', err.message);
    }
  }

  client.once('ready', () => {
    console.log('📦 Sistema de stock iniciado (SCRAPING)');

    atualizarStock();

    setInterval(atualizarStock, 1000 * 60 * 5);
  });

};
