const eco = require('./economia');

const DONO_ID = '1374388082908069899';

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!addmoney')) return;

    if (message.author.id !== DONO_ID) {
      return message.reply('❌ Você não pode usar.');
    }

    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const valor = parseInt(args[2]);

    if (!user || !valor) {
      return message.reply('❌ Use: !addmoney @user <valor>');
    }

    eco.addSaldo(user.id, valor);

    message.reply(`💰 ${user.username} recebeu ${valor} moedas.`);
  });

};
