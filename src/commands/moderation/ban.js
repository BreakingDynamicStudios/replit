const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning'))
        .addNumberOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setMinValue(0)
                .setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'BanMembers')) return;

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const days = interaction.options.getNumber('days') || 0;

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            if (!target.bannable) {
                return await interaction.reply({
                    content: 'I cannot ban this user!',
                    ephemeral: true
                });
            }

            await target.ban({ deleteMessageDays: days, reason: reason });
            logger.info(`${target.user.tag} was banned by ${interaction.user.tag} for: ${reason}`);

            await interaction.reply({
                content: `Successfully banned ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in ban command:', error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
