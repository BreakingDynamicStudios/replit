const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist a user from specific channels')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to blacklist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for blacklisting')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (optional)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ModerateMembers')) return;

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason');
            const duration = interaction.options.getNumber('duration');

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            // Send immediate response
            await interaction.reply({
                content: 'Applying blacklist...',
                ephemeral: true
            });

            // Get all text channels
            const channels = interaction.guild.channels.cache.filter(
                channel => channel.type === 0 // GuildText
            );

            // Add permissions overwrite for each channel
            for (const [_, channel] of channels) {
                await channel.permissionOverwrites.edit(target, {
                    SendMessages: false,
                    ViewChannel: false,
                });
            }

            // Send DM to user
            const timestamp = new Date().toISOString();
            const dmMessage = `You have been blacklisted in ${interaction.guild.name}\n`
                + `**Reason:** ${reason}\n`
                + `**Time:** ${timestamp}\n`
                + (duration ? `**Duration:** ${duration} minutes` : '**Duration:** Indefinite');

            try {
                await target.send(dmMessage);
            } catch (error) {
                logger.warn(`Could not DM blacklist notification to ${target.user.tag}`);
            }

            // Log the action
            await logModAction(interaction, 'blacklist', target, reason, duration);

            // If duration is set, schedule un-blacklist
            if (duration) {
                setTimeout(async () => {
                    for (const [_, channel] of channels) {
                        await channel.permissionOverwrites.delete(target.id);
                    }
                    logger.info(`Blacklist expired for ${target.user.tag}`);
                    await logModAction(interaction, 'un-blacklist', target, 'Duration expired');
                }, duration * 60 * 1000);
            }

            await interaction.followUp({
                content: `Successfully blacklisted ${target.user.tag}\nReason: ${reason}${duration ? `\nDuration: ${duration} minutes` : ''}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in blacklist command:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            }
        }
    },
};