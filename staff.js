const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const warns = new Map();

module.exports = (client) => {

  // CRIAR / PEGAR CANAL DE LOGS
  async function getLogChannel(guild) {
    let canal = guild.channels.cache.find(c => c.name === '📜丨logs');

    if (!canal) {
      canal = await guild.channels.create({
        name: '📜丨logs',
        type: 0
      });
    }

    return canal;
  }

  // ===== COMANDOS =====
  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ===== WARN =====
    if (cmd === 'warn') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return message.reply('Sem permissão');

      const user = message.mentions.members.first();
      if (!user) return message.reply('Marca alguém');

      const motivo = args.slice(1).join(' ') || 'Sem motivo';

      if (!warns.has(user.id)) warns.set(user.id, 0);
      warns.set(user.id, warns.get(user.id) + 1);

      const total = warns.get(user.id);

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Warn aplicado')
        .addFields(
          { name: 'Usuário', value: user.user.tag },
          { name: 'Staff', value: message.author.tag },
          { name: 'Motivo', value: motivo },
          { name: 'Total de warns', value: `${total}` }
        );

      message.channel.send({ embeds: [embed] });

      const log = await getLogChannel(message.guild);
      log.send({ embeds: [embed] });

      // ===== PUNIÇÕES AUTOMÁTICAS =====
      if (total === 3) {
        await user.timeout(10 * 60 * 1000);

        const e = new EmbedBuilder()
          .setColor('Orange')
          .setTitle('🔇 Mute automático')
          .setDescription(`${user.user.tag} recebeu 3 warns`);

        log.send({ embeds: [e] });
      }

      if (total === 5) {
        await user.ban({ reason: '5 warns acumulados' });

        const e = new EmbedBuilder()
          .setColor('Red')
          .setTitle('🔨 Ban automático')
          .setDescription(`${user.user.tag} atingiu 5 warns`);

        log.send({ embeds: [e] });
      }
    }

    // ===== CLEAR =====
    if (cmd === 'clear') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return;

      const q = parseInt(args[0]);
      if (!q) return;

      await message.channel.bulkDelete(q, true);

      const log = await getLogChannel(message.guild);

      log.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('🧹 Chat limpo')
            .setDescription(`${message.author.tag} apagou ${q} mensagens`)
        ]
      });
    }

    // ===== BAN =====
    if (cmd === 'ban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return;

      const user = message.mentions.members.first();
      if (!user) return;

      await user.ban();

      const log = await getLogChannel(message.guild);

      log.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔨 Usuário banido')
            .addFields(
              { name: 'Usuário', value: user.user.tag },
              { name: 'Staff', value: message.author.tag }
            )
        ]
      });
    }

    // ===== KICK =====
    if (cmd === 'kick') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
        return;

      const user = message.mentions.members.first();
      if (!user) return;

      await user.kick();

      const log = await getLogChannel(message.guild);

      log.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Orange')
            .setTitle('👢 Usuário kickado')
            .addFields(
              { name: 'Usuário', value: user.user.tag },
              { name: 'Staff', value: message.author.tag }
            )
        ]
      });
    }

  });

};
