const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'KickMembers')) return;

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            if (!target.kickable) {
                return await interaction.reply({
                    content: 'I cannot kick this user!',
                    ephemeral: true
                });
            }

            await target.kick(reason);
            await logModAction(interaction, 'kick', target, reason);

            await interaction.reply({
                content: `Successfully kicked ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in kick command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};