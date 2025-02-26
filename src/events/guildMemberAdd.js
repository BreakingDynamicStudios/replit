const { handleNewMember } = require('../utils/altDetector');
const { logger } = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            await handleNewMember(member);
        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    }
};
