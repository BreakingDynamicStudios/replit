const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicketChannel, closeTicketChannel, addUserToTicket, removeUserFromTicket } = require('../../utils/ticketUtils');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage support tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new support ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for creating the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close an existing ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add to the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the ticket')
                        .setRequired(true))),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'create': {
                    const reason = interaction.options.getString('reason');
                    const channel = await createTicketChannel(interaction, reason);
                    
                    await interaction.reply({
                        content: `Ticket created! Please check ${channel}`,
                        ephemeral: true
                    });
                    break;
                }

                case 'close': {
                    // Check if this is a ticket channel
                    if (!interaction.channel.name.startsWith('ticket-')) {
                        return await interaction.reply({
                            content: 'This command can only be used in ticket channels!',
                            ephemeral: true
                        });
                    }

                    const reason = interaction.options.getString('reason');
                    await closeTicketChannel(interaction.channel, interaction.user, reason);
                    
                    await interaction.reply({
                        content: 'Ticket will be closed and archived.',
                        ephemeral: true
                    });
                    break;
                }

                case 'add': {
                    // Check if this is a ticket channel
                    if (!interaction.channel.name.startsWith('ticket-')) {
                        return await interaction.reply({
                            content: 'This command can only be used in ticket channels!',
                            ephemeral: true
                        });
                    }

                    const user = interaction.options.getUser('user');
                    await addUserToTicket(interaction.channel, user, interaction.user);
                    
                    await interaction.reply({
                        content: `Added ${user} to the ticket.`,
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    // Check if this is a ticket channel
                    if (!interaction.channel.name.startsWith('ticket-')) {
                        return await interaction.reply({
                            content: 'This command can only be used in ticket channels!',
                            ephemeral: true
                        });
                    }

                    const user = interaction.options.getUser('user');
                    await removeUserFromTicket(interaction.channel, user, interaction.user);
                    
                    await interaction.reply({
                        content: `Removed ${user} from the ticket.`,
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            logger.error('Error in ticket command:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            }
        }
    },
};
