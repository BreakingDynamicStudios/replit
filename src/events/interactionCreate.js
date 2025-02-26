const { logger } = require('../utils/logger');
const { createTicketChannel } = require('../utils/ticketUtils');
const { ChannelType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                // Handle ticket creation buttons
                if (interaction.customId.startsWith('ticket_')) {
                    await interaction.deferReply({ ephemeral: true });

                    try {
                        const ticketType = interaction.customId.split('_')[1];
                        let category = '';
                        let emoji = '';

                        switch (ticketType) {
                            case 'report':
                                category = 'Emergency Support';
                                emoji = '📢';
                                break;
                            case 'moderation':
                                category = 'Moderation Support';
                                emoji = '🛡️';
                                break;
                            case 'general':
                                category = 'General Enquiry';
                                emoji = '❓';
                                break;
                        }

                        const channel = await createTicketChannel(
                            interaction,
                            `${emoji} ${category} | ${interaction.user.username}`
                        );

                        await interaction.editReply({
                            content: `Your ticket has been created: ${channel}`,
                            ephemeral: true
                        });
                    } catch (error) {
                        logger.error('Error creating ticket from panel:', error);
                        await interaction.editReply({
                            content: 'There was an error creating your ticket!',
                            ephemeral: true
                        });
                    }
                    return;
                }

                // Handle case and investigation buttons
                if (interaction.customId.startsWith('case_') || interaction.customId.startsWith('investigation_')) {
                    const [type, action] = interaction.customId.split('_');
                    const capitalized = type.charAt(0).toUpperCase() + type.slice(1);

                    if (action === 'claim') {
                        await interaction.reply({
                            content: `${interaction.user} has claimed this ${type}!`,
                            ephemeral: false
                        });

                        // Update the channel name to show who claimed it
                        const newName = `${type}-claimed-${interaction.user.username}`;
                        await interaction.channel.setName(newName);

                        logger.info(`${interaction.user.tag} claimed ${type} in channel ${interaction.channel.name}`);
                    } else if (action === 'close') {
                        await interaction.reply({
                            content: `${interaction.user} has closed this ${type}!`,
                            ephemeral: false
                        });

                        // Find or create #archived channel
                        let archivedChannel = interaction.guild.channels.cache.find(
                            c => c.name === 'archived' && c.type === ChannelType.GuildText
                        );

                        if (!archivedChannel) {
                            archivedChannel = await interaction.guild.channels.create({
                                name: 'archived',
                                type: ChannelType.GuildText,
                            });
                        }

                        // Create transcript
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const transcript = messages.reverse().map(msg => {
                            const time = msg.createdAt.toISOString();
                            return `[${time}] ${msg.author.tag}: ${msg.content}`;
                        }).join('\n');

                        // Send transcript to #archived
                        await archivedChannel.send({
                            content: `**${capitalized} Transcript**\n` +
                                `**Channel:** ${interaction.channel.name}\n` +
                                `**Closed by:** ${interaction.user.tag}\n` +
                                `**Time:** ${new Date().toISOString()}\n` +
                                '```\n' + transcript + '\n```'
                        });

                        // Log and delete the channel
                        logger.info(`${interaction.user.tag} closed ${type} channel ${interaction.channel.name}`);
                        await interaction.channel.delete();
                    }
                    return;
                }
            }

            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error('Error executing command:', error);
                const reply = {
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        } catch (error) {
            logger.error('Error in interaction handler:', error);
        }
    },
};