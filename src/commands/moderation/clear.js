const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from a channel')
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageMessages')) return;

            const amount = interaction.options.getNumber('amount');

            const messages = await interaction.channel.bulkDelete(amount, true);
            logger.info(`${interaction.user.tag} cleared ${messages.size} messages in ${interaction.channel.name}`);

            await interaction.reply({
                content: `Successfully cleared ${messages.size} messages.`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in clear command:', error);
            await interaction.reply({
                content: 'There was an error executing this command! Messages older than 14 days cannot be deleted.',
                ephemeral: true
            });
        }
    },
};
