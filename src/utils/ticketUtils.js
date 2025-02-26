const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('./logger');

async function createTicketChannel(interaction, title) {
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

        // Create an embed for the initial ticket message
        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(title)
            .setDescription('Thank you for creating a ticket. Our staff team will assist you shortly.')
            .addFields(
                { 
                    name: '📋 Ticket Information',
                    value: `**Ticket ID:** #${ticketNumber}\n**Created by:** ${interaction.user}\n**Created at:** ${new Date().toLocaleString()}`
                }
            );

        // Add specific guidance based on ticket type
        if (title.includes('Emergency')) {
            embed.addFields({
                name: '📝 Important Information Needed',
                value: 'You are in a safe space. Please share what you feel comfortable with, including:\n' +
                    '• What happened that made you feel uncomfortable\n' +
                    '• Any screenshots or message links you can share\n' +
                    '• The Discord usernames of those involved\n' +
                    '• When this occurred\n' +
                    '• Any other details you think are important\n\n' +
                    '**Remember:** Your safety and comfort are our priority. Take your time, and know that our staff is here to help and protect you.'
            });
        } else if (title.includes('Moderation')) {
            embed.addFields({
                name: '📝 Next Steps',
                value: 'Please describe what you need assistance with and our moderation team will help you as soon as possible.'
            });
        } else {
            embed.addFields({
                name: '📝 Next Steps',
                value: 'Please describe your inquiry in detail and we will assist you shortly.'
            });
        }

        embed.setFooter({ 
            text: `To close this ticket, use /ticket close` 
        });

        // Send the embed
        await channel.send({
            content: `${interaction.user} Welcome to your ticket!`,
            embeds: [embed]
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