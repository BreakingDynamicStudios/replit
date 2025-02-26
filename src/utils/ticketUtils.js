const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { logger } = require('./logger');

async function createTicketChannel(interaction, reason) {
    try {
        // Find or create Tickets category
        let ticketsCategory = interaction.guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && 
            c.name === 'Tickets'
        );

        if (!ticketsCategory) {
            ticketsCategory = await interaction.guild.channels.create({
                name: 'Tickets',
                type: ChannelType.GuildCategory
            });
            logger.info(`Created Tickets category`);
        }

        // Create ticket channel with formatted name
        const ticketNumber = Math.floor(Math.random() * 10000);
        const channelName = `ticket-${ticketNumber}`;
        
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketsCategory.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: interaction.guild.members.me.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels,
                    ],
                },
            ],
        });

        // Send initial ticket information
        await channel.send({
            content: `**Ticket #${ticketNumber}**\n`
                + `**Created by:** ${interaction.user}\n`
                + `**Reason:** ${reason}\n\n`
                + `Staff will be with you shortly. To close this ticket, use \`/ticket close\`.`
        });

        logger.info(`${interaction.user.tag} created ticket channel ${channel.name}`);
        return channel;
    } catch (error) {
        logger.error('Error creating ticket channel:', error);
        throw error;
    }
}

async function closeTicketChannel(channel, closer, reason) {
    try {
        // Send closing message
        await channel.send({
            content: `**Ticket Closed**\n`
                + `**Closed by:** ${closer}\n`
                + `**Reason:** ${reason}\n`
                + `This channel will be archived.`
        });

        // Archive the channel
        await channel.setArchived(true);
        logger.info(`${closer.tag} closed ticket channel ${channel.name}`);
    } catch (error) {
        logger.error('Error closing ticket channel:', error);
        throw error;
    }
}

async function addUserToTicket(channel, user, adder) {
    try {
        await channel.permissionOverwrites.create(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
        });

        await channel.send(`${user} has been added to the ticket by ${adder}`);
        logger.info(`${adder.tag} added ${user.tag} to ticket channel ${channel.name}`);
    } catch (error) {
        logger.error('Error adding user to ticket:', error);
        throw error;
    }
}

async function removeUserFromTicket(channel, user, remover) {
    try {
        await channel.permissionOverwrites.delete(user);
        await channel.send(`${user} has been removed from the ticket by ${remover}`);
        logger.info(`${remover.tag} removed ${user.tag} from ticket channel ${channel.name}`);
    } catch (error) {
        logger.error('Error removing user from ticket:', error);
        throw error;
    }
}

module.exports = {
    createTicketChannel,
    closeTicketChannel,
    addUserToTicket,
    removeUserFromTicket
};
