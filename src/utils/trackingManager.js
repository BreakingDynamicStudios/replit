const { logger } = require('./logger');

// Export the activeTracking map so it can be accessed from the track command
const activeTracking = new Map();

async function handleNewChannel(channel) {
    try {
        // Only handle text channels
        if (channel.type !== 0) return;

        // Set up collectors for all currently tracked users in this new channel
        for (const [userId, collectors] of activeTracking.entries()) {
            const collector = channel.createMessageCollector({
                filter: m => m.author.id === userId
            });

            collector.on('collect', async message => {
                try {
                    // Find the tracking channel for this user
                    const trackingChannel = channel.guild.channels.cache.find(
                        c => c.name === `tracking-${message.author.username.toLowerCase()}`
                    );

                    if (trackingChannel) {
                        await trackingChannel.send(
                            `**Channel:** ${message.channel.name}\n` +
                            `**Time:** ${message.createdAt.toISOString()}\n` +
                            `**Content:** ${message.content}\n` +
                            `**Attachments:** ${message.attachments.size}\n` +
                            '-'.repeat(40)
                        );
                        logger.info(`Tracked message from ${message.author.tag} in ${message.channel.name}`);
                    }
                } catch (error) {
                    logger.error(`Error logging tracked message: ${error}`);
                }
            });

            collectors.set(channel.id, collector);
            logger.info(`Set up tracking collector for ${userId} in new channel ${channel.name}`);
        }
    } catch (error) {
        logger.error('Error handling new channel:', error);
    }
}

module.exports = {
    activeTracking,
    handleNewChannel
};
