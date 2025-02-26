const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { checkForAlts } = require('../../utils/altDetector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-alts')
        .setDescription('Check for potential alt accounts of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check for alts')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ModerateMembers')) return;

            const target = interaction.options.getMember('target');

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const potentialAlts = await checkForAlts(target, interaction.guild);

            if (potentialAlts.length === 0) {
                await interaction.editReply({
                    content: 'No potential alt accounts detected for this user.',
                    ephemeral: true
                });
                return;
            }

            const response = `**Potential Alt Accounts for ${target.user.tag}**\n`
                + `Account Created: ${target.user.createdAt.toUTCString()}\n\n`
                + `**Similar Accounts Found:**\n`
                + potentialAlts.map(alt => 
                    `• ${alt.member.user.tag}\n`
                    + `  Similarity Score: ${alt.score}%\n`
                    + `  Account Created: ${alt.member.user.createdAt.toUTCString()}`
                ).join('\n\n');

            await interaction.editReply({
                content: response,
                ephemeral: true
            });

        } catch (error) {
            logger.error('Error in check-alts command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            }
        }
    },
};
