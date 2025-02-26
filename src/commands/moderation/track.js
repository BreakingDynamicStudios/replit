const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('track-data')
        .setDescription('Create a channel to track user messages')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to track')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for tracking')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason');

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            // Send immediate response
            await interaction.reply({
                content: 'Setting up tracking channel...',
                ephemeral: true
            });

            // Find or create Tracking category
            let trackingCategory = interaction.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && 
                c.name === 'Tracking'
            );

            if (!trackingCategory) {
                trackingCategory = await interaction.guild.channels.create({
                    name: 'Tracking',
                    type: ChannelType.GuildCategory
                });
                logger.info(`Created Tracking category`);
            }

            // Create tracking channel
            const channelName = `tracking-${target.user.username.toLowerCase()}`;
            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: trackingCategory.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: interaction.guild.members.me.id,
                        allow: ['ViewChannel', 'SendMessages'],
                    },
                ],
            });

            // Send initial tracking information
            await channel.send(
                `**Tracking User:** ${target.user.tag}\n` +
                `**Reason:** ${reason}\n` +
                `**Started by:** ${interaction.user.tag}\n` +
                `**Start Time:** ${new Date().toISOString()}\n\n` +
                `All messages from this user will be logged below:`
            );

            // Set up message tracking
            interaction.guild.channels.cache
                .filter(channel => channel.type === ChannelType.GuildText)
                .forEach(textChannel => {
                    const collector = textChannel.createMessageCollector({
                        filter: m => m.author.id === target.id
                    });

                    collector.on('collect', async message => {
                        await channel.send(
                            `**Channel:** ${message.channel.name}\n` +
                            `**Time:** ${message.createdAt.toISOString()}\n` +
                            `**Content:** ${message.content}\n` +
                            `**Attachments:** ${message.attachments.size}\n` +
                            '-'.repeat(40)
                        );
                    });
                });

            await logModAction(interaction, 'track-data', target, reason);

            // Send follow-up message with channel info
            await interaction.followUp({
                content: `Created tracking channel for ${target.user.tag}: ${channel}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in track-data command:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'There was an error creating the tracking channel!',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: 'There was an error creating the tracking channel!',
                    ephemeral: true
                });
            }
        }
    },
};