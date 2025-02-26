const { handleNewChannel } = require('../utils/trackingManager');
const { logger } = require('../utils/logger');

module.exports = {
    name: 'channelCreate',
    async execute(channel) {
        try {
            // Only handle text channels
            if (channel.type !== 0) return;
            
            await handleNewChannel(channel);
        } catch (error) {
            logger.error('Error in channelCreate event:', error);
        }
    }
};
