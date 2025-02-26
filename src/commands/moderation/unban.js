const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unbanning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'BanMembers')) return;

            const userId = interaction.options.getString('userid');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            try {
                const ban = await interaction.guild.bans.fetch(userId);
                if (!ban) {
                    return await interaction.reply({
                        content: 'This user is not banned!',
                        ephemeral: true
                    });
                }

                await interaction.guild.members.unban(userId, reason);
                await logModAction(interaction, 'unban', ban.user, reason);

                await interaction.reply({
                    content: `Successfully unbanned ${ban.user.tag}\nReason: ${reason}`,
                    ephemeral: true
                });
            } catch (error) {
                return await interaction.reply({
                    content: 'Could not find a ban for that user!',
                    ephemeral: true
                });
            }
        } catch (error) {
            logger.error('Error in unban command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
