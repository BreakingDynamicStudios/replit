const { ChannelType } = require('discord.js');
const { logger } = require('./logger');

async function ensureLogChannel(guild, channelName) {
    let channel = guild.channels.cache.find(
        c => c.name === channelName && c.type === ChannelType.GuildText
    );

    if (!channel) {
        channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
        });
        logger.info(`Created logging channel: ${channelName}`);
    }

    return channel;
}

async function sendModeratedUserDM(target, action, moderator, reason, guild, duration = null) {
    const timestamp = new Date().toISOString();
    let dmMessage = `**Moderation Notice from ${guild.name}**\n\n`
        + `**Action:** ${action.toUpperCase()}\n`
        + `**Moderator:** ${moderator.tag}\n`
        + `**Reason:** ${reason}\n`
        + `**Timestamp:** ${timestamp}`;

    if (duration) {
        dmMessage += `\n**Duration:** ${duration} minutes`;
    }

    dmMessage += '\n\nIf you believe this action was taken in error, please contact the server administrators.';

    try {
        await target.send(dmMessage);
    } catch (error) {
        logger.warn(`Could not send DM to ${target.tag} for ${action}`);
    }
}

async function logModAction(interaction, action, target, reason, duration = null) {
    try {
        const allLogsChannel = await ensureLogChannel(interaction.guild, 'all-logs');
        const punishmentChannel = await ensureLogChannel(interaction.guild, 'punishment');

        const timestamp = new Date().toISOString();
        const moderator = interaction.user.tag;
        const targetUser = target.user ? target.user.tag : target.tag || target.name;

        let logMessage = `**${action.toUpperCase()}**\n`
            + `**Moderator:** ${moderator}\n`
            + `**User:** ${targetUser}\n`
            + `**Reason:** ${reason}\n`
            + `**Time:** ${timestamp}`;

        if (duration) {
            logMessage += `\n**Duration:** ${duration} minutes`;
        }

        await allLogsChannel.send(logMessage);
        await punishmentChannel.send(logMessage);

        // Send DM to the user if target is a GuildMember or User
        if (target.user || target.send) {
            await sendModeratedUserDM(
                target.user || target,
                action,
                interaction.user,
                reason,
                interaction.guild,
                duration
            );
        }

        logger.info(`Moderation action logged - ${action} by ${moderator} on ${targetUser}`);
    } catch (error) {
        logger.error('Error logging moderation action:', error);
    }
}

module.exports = {
    logModAction,
    sendModeratedUserDM
};