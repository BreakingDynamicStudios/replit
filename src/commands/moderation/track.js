const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');
const { logModAction } = require('../../utils/modLogger');

// Store active tracking collectors
const activeTracking = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('track-data')
        .setDescription('Create a channel to track user messages')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start tracking a user\'s messages')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to track')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for tracking')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop tracking a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to stop tracking')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const subcommand = interaction.options.getSubcommand();
            const target = interaction.options.getMember('target');

            if (!target) {
                return await interaction.reply({
                    content: 'Could not find that member!',
                    ephemeral: true
                });
            }

            if (subcommand === 'stop') {
                // Stop tracking
                if (!activeTracking.has(target.id)) {
                    return await interaction.reply({
                        content: 'This user is not being tracked!',
                        ephemeral: true
                    });
                }

                const collectors = activeTracking.get(target.id);
                collectors.forEach(collector => collector.stop());
                activeTracking.delete(target.id);

                await logModAction(interaction, 'stop-tracking', target, 'Tracking stopped');

                await interaction.reply({
                    content: `Stopped tracking ${target.user.tag}`,
                    ephemeral: true
                });
                return;
            }

            // Start tracking
            const reason = interaction.options.getString('reason');

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

            // Stop any existing tracking for this user
            if (activeTracking.has(target.id)) {
                const oldCollectors = activeTracking.get(target.id);
                oldCollectors.forEach(collector => collector.stop());
            }

            // Set up message tracking
            const collectors = new Map();
            interaction.guild.channels.cache
                .filter(channel => channel.type === ChannelType.GuildText)
                .forEach(textChannel => {
                    const collector = textChannel.createMessageCollector({
                        filter: m => m.author.id === target.id
                    });

                    collector.on('collect', async message => {
                        try {
                            await channel.send(
                                `**Channel:** ${message.channel.name}\n` +
                                `**Time:** ${message.createdAt.toISOString()}\n` +
                                `**Content:** ${message.content}\n` +
                                `**Attachments:** ${message.attachments.size}\n` +
                                '-'.repeat(40)
                            );
                            logger.info(`Tracked message from ${target.user.tag} in ${message.channel.name}`);
                        } catch (error) {
                            logger.error(`Error logging tracked message: ${error}`);
                        }
                    });

                    collectors.set(textChannel.id, collector);
                });

            // Store collectors for this user
            activeTracking.set(target.id, collectors);

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