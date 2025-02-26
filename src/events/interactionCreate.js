const { logger } = require('../utils/logger');
const { createTicketChannel } = require('../utils/ticketUtils');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                // Handle ticket creation buttons
                if (interaction.customId.startsWith('ticket_')) {
                    await interaction.deferReply({ ephemeral: true });

                    try {
                        const ticketType = interaction.customId.split('_')[1];
                        let category = '';
                        let emoji = '';

                        switch (ticketType) {
                            case 'report':
                                category = 'Report';
                                emoji = '📢';
                                break;
                            case 'moderation':
                                category = 'Moderation Support';
                                emoji = '🛡️';
                                break;
                            case 'general':
                                category = 'General Enquiry';
                                emoji = '❓';
                                break;
                        }

                        const channel = await createTicketChannel(
                            interaction,
                            `${emoji} ${category} | ${interaction.user.username}`
                        );

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