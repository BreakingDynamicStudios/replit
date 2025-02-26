const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ModerateMembers')) return;

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason');

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            // Send warning to the user
            try {
                await target.send(`You have been warned in ${interaction.guild.name}\nReason: ${reason}`);
            } catch (error) {
                logger.warn(`Could not DM warning to ${target.user.tag}`);
            }

            await logModAction(interaction, 'warn', target, reason);

            await interaction.reply({
                content: `Successfully warned ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in warn command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};