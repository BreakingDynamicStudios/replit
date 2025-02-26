const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket-panel')
        .setDescription('Create a ticket panel in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎫 Support Ticket System')
                .setDescription('Welcome to our support system! We are here to protect and support our members, especially those experiencing difficulties on Discord. Please select the appropriate category for your ticket below.')
                .addFields(
                    { 
                        name: '📢 Emergency Support - External Issues',
                        value: 'For members experiencing discomfort or anxiety from DMs or external servers\n*(A safe space to discuss concerns about interactions outside our server)*',
                        inline: true
                    },
                    {
                        name: '🛡️ Moderation Support',
                        value: 'Get assistance from our moderation team',
                        inline: true
                    },
                    {
                        name: '❓ General Enquiries',
                        value: 'Ask questions or get general help',
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '**Guidelines**\n• One ticket per issue\n• Be patient and respectful\n• Provide all relevant information\n• For reports, please include screenshots or message links when possible\n\n**Click the emoji buttons below:**\n📢 - Emergency Support\n🛡️ - Moderation Support\n❓ - General Help'
                    }
                )
                .setFooter({ 
                    text: 'Click a button below to create a ticket | Your ticket will be handled by our staff team | We are here to help and protect you' 
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_report')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('📢'),
                    new ButtonBuilder()
                        .setCustomId('ticket_moderation')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🛡️'),
                    new ButtonBuilder()
                        .setCustomId('ticket_general')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('❓')
                );

            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: 'Ticket panel has been set up!',
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in setup-ticket-panel command:', error);
            await interaction.reply({
                content: 'There was an error creating the ticket panel!',
                ephemeral: true
            });
        }
    },
};