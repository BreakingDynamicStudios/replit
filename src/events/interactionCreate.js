const { logger } = require('../utils/logger');
const { createTicketChannel } = require('../utils/ticketUtils');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'create_ticket') {
                    await interaction.deferReply({ ephemeral: true });

                    try {
                        const channel = await createTicketChannel(interaction, 'Ticket created from panel');
                        await interaction.editReply({
                            content: `Your ticket has been created: ${channel}`,
                            ephemeral: true
                        });
                    } catch (error) {
                        logger.error('Error creating ticket from panel:', error);
                        await interaction.editReply({
                            content: 'There was an error creating your ticket!',
                            ephemeral: true
                        });
                    }
                    return;
                }
            }

            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error('Error executing command:', error);
                const reply = {
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        } catch (error) {
            logger.error('Error in interaction handler:', error);
        }
    },
};