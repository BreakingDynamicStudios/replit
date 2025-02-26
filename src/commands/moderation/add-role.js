const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

function handleRoleError(error) {
    if (error.code === 50013) {
        return "I don't have permission to manage this role. Please make sure my role is higher in the server's role hierarchy.";
    }
    return "An error occurred while managing the role. Please check my permissions.";
}
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-role')
        .setDescription('Add a role to a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to add the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for adding the role'))
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
                    content: 'You cannot add a role that is higher than or equal to your highest role!',
                    ephemeral: true
                });
            }

            await target.roles.add(role, reason);
            await logModAction(interaction, 'add-role', target, `Role: ${role.name}, Reason: ${reason}`);

            await interaction.reply({
                content: `Successfully added role ${role.name} to ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in add-role command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
