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
                .setColor(0x0099FF)
                .setTitle('🎫 Support Ticket System')
                .setDescription('Need help? Click the button below to create a ticket.\n\nOur support team will assist you as soon as possible.')
                .addFields(
                    { name: 'Guidelines', value: '• One ticket per issue\n• Be patient and respectful\n• Provide all relevant information' }
                )
                .setFooter({ text: 'Click the button below to create a ticket' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
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
