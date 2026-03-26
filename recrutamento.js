module.exports = (client) => {

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'aplicar') {
            await interaction.reply({
                content: 'Qual seu Nick?',
                ephemeral: true
            });
        }
    });

};
