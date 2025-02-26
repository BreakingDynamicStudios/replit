const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ModerateMembers')) return;

            const target = interaction.options.getMember('target');
            const duration = interaction.options.getNumber('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            if (!target.moderatable) {
                return await interaction.reply({
                    content: 'I cannot timeout this user!',
                    ephemeral: true
                });
            }

            await target.timeout(duration * 60 * 1000, reason);
            logger.info(`${target.user.tag} was timed out by ${interaction.user.tag} for ${duration} minutes. Reason: ${reason}`);

            await interaction.reply({
                content: `Successfully timed out ${target.user.tag} for ${duration} minutes\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in timeout command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
