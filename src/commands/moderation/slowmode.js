const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for the current channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for setting slowmode'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const seconds = interaction.options.getInteger('seconds');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.channel.setRateLimitPerUser(seconds, reason);

            const response = seconds === 0
                ? 'Slowmode has been disabled.'
                : `Slowmode has been set to ${seconds} seconds.`;

            // Log the action using the modLogger
            await logModAction(interaction, 'slowmode', interaction.channel, reason);

            await interaction.reply({
                content: `${response}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in slowmode command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};