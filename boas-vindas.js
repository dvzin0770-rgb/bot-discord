const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  client.on('guildMemberAdd', async (member) => {

    const canal = member.guild.channels.cache.get('1483173824835883073');

    if (!canal) return;

    const embed = new EmbedBuilder()
      .setColor('#00b0f4')
      .setTitle(`${member.user.username} | Bem-vindo(a)!`)
      .setDescription(
`👋 Olá, seja bem-vindo(a) ao **FROSTVOW ❄️**!

📋 Faça o <#1485275251251220502> para jogar conosco!

🛡️ **Tag do Usuário**
${member.user.tag}
(${member.id})

🚨 **Precisando de ajuda?**
Chame nossa equipe!

👮 **Evite punições!**
Leia <#1485256438174584893> para evitar problemas!`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'FROSTVOW ❄️ • Todos os direitos reservados' })
      .setTimestamp();

    canal.send({
      content: `🎉 | ${member}`, // 🔥 MARCA O USUÁRIO
      embeds: [embed]
    });

  });

};
