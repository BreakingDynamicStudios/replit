const { handleNewMember } = require('../utils/altDetector');
const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Alt detection check
            await handleNewMember(member);

            // Find or create welcome channel
            let welcomeChannel = member.guild.channels.cache.find(
                channel => channel.name === 'welcome'
            );

            if (!welcomeChannel) {
                welcomeChannel = await member.guild.channels.create({
                    name: 'welcome',
                    type: 0, // Text channel
                });
                logger.info('Created welcome channel');
            }

            // Create welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('👋 Welcome to the Server!')
                .setDescription(`Welcome ${member} to ${member.guild.name}!`)
                .addFields(
                    { 
                        name: '📜 About Us',
                        value: 'We\'re a community focused on providing a safe and supportive environment.'
                    },
                    {
                        name: '❓ Need Help?',
                        value: 'Use `/ticket create` to open a support ticket if you need assistance.'
                    },
                    {
                        name: '👥 Member Count',
                        value: `You are our ${member.guild.memberCount}th member!`
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `ID: ${member.id}`
                });

            // Send welcome message
            await welcomeChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed]
            });

            logger.info(`Sent welcome message for new member ${member.user.tag}`);
        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    }
};