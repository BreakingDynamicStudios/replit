const { logger } = require('./logger');

// Scoring system for alt detection
const ALT_SCORE_THRESHOLD = 70; // Score above which accounts are considered potential alts

function calculateSimilarityScore(user1, user2) {
    let score = 0;
    const maxScore = 100;

    // Check account creation dates
    const timeDifference = Math.abs(user1.createdTimestamp - user2.createdTimestamp);
    if (timeDifference < 1000 * 60 * 60 * 24) { // Within 24 hours
        score += 30;
    } else if (timeDifference < 1000 * 60 * 60 * 24 * 7) { // Within a week
        score += 15;
    }

    // Check username similarities
    const username1 = user1.username.toLowerCase();
    const username2 = user2.username.toLowerCase();
    
    // Check for similar patterns in usernames
    if (username1.includes(username2) || username2.includes(username1)) {
        score += 25;
    }

    // Check for similar character patterns
    const commonChars = username1.split('').filter(char => username2.includes(char)).length;
    const similarityRatio = commonChars / Math.max(username1.length, username2.length);
    if (similarityRatio > 0.7) {
        score += 20;
    }

    // Check discriminator (last 4 digits)
    if (user1.discriminator === user2.discriminator) {
        score += 15;
    }

    return Math.min(score, maxScore);
}

async function checkForAlts(member, guild) {
    try {
        const potentialAlts = [];
        const members = await guild.members.fetch();

        members.forEach(existingMember => {
            if (existingMember.id === member.id) return;

            const score = calculateSimilarityScore(member.user, existingMember.user);
            if (score >= ALT_SCORE_THRESHOLD) {
                potentialAlts.push({
                    member: existingMember,
                    score: score
                });
            }
        });

        return potentialAlts;
    } catch (error) {
        logger.error('Error in alt detection:', error);
        return [];
    }
}

async function handleNewMember(member) {
    try {
        const potentialAlts = await checkForAlts(member, member.guild);
        
        if (potentialAlts.length > 0) {
            // Find or create mod-alerts channel
            let alertChannel = member.guild.channels.cache.find(
                channel => channel.name === 'mod-alerts'
            );

            if (!alertChannel) {
                alertChannel = await member.guild.channels.create({
                    name: 'mod-alerts',
                    type: 0, // Text channel
                    permissionOverwrites: [
                        {
                            id: member.guild.roles.everyone,
                            deny: ['ViewChannel'],
                        }
                    ]
                });
            }

            // Send alert to mods
            const alertMessage = `🚨 **Potential Alt Account Detected**\n`
                + `New Member: ${member.user.tag} (${member.id})\n`
                + `Account Created: ${member.user.createdAt.toUTCString()}\n\n`
                + `**Similar to:**\n`
                + potentialAlts.map(alt => 
                    `• ${alt.member.user.tag} (${alt.member.id})\n`
                    + `  Similarity Score: ${alt.score}%\n`
                    + `  Their Account Created: ${alt.member.user.createdAt.toUTCString()}`
                ).join('\n\n');

            await alertChannel.send(alertMessage);
            logger.info(`Alt detection alert sent for user ${member.user.tag}`);
        }
    } catch (error) {
        logger.error('Error in alt detection handler:', error);
    }
}

module.exports = {
    handleNewMember,
    checkForAlts
};
