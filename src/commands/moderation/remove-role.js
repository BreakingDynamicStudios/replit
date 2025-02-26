const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-role')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to remove the role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing the role'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageRoles')) return;

            const target = interaction.options.getMember('target');
            const role = interaction.options.getRole('role');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            if (!role) {
                return await interaction.reply({
                    content: 'Could not find that role!',
                    ephemeral: true
                });
            }

            if (role.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: 'You cannot remove a role that is higher than or equal to your highest role!',
                    ephemeral: true
                });
            }

            if (!target.roles.cache.has(role.id)) {
                return await interaction.reply({
                    content: `${target.user.tag} doesn't have the role ${role.name}!`,
                    ephemeral: true
                });
            }

            await target.roles.remove(role, reason);
            await logModAction(interaction, 'remove-role', target, `Role: ${role.name}, Reason: ${reason}`);

            await interaction.reply({
                content: `Successfully removed role ${role.name} from ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in remove-role command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
