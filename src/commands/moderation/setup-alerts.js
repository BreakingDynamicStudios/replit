const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-alerts')
        .setDescription('Set up the moderation alerts channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageGuild')) return;

            // Find or create mod-alerts channel
            let alertChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-alerts'
            );

            if (!alertChannel) {
                alertChannel = await interaction.guild.channels.create({
                    name: 'mod-alerts',
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ['ViewChannel'],
                        },
                        {
                            id: interaction.guild.members.me.id,
                            allow: ['ViewChannel', 'SendMessages', 'EmbedLinks'],
                        }
                    ]
                });

                // Add initial message
                await alertChannel.send({
                    content: '🚨 **Moderation Alerts Channel**\n\n' +
                        'This channel will be used for:\n' +
                        '• Alt account detection alerts\n' +
                        '• New member join notifications\n' +
                        '• Suspicious activity reports\n\n' +
                        'Only moderators can see this channel.'
                });

                logger.info(`Created mod-alerts channel`);
            }

            await interaction.reply({
                content: `Alerts channel has been set up: ${alertChannel}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in setup-alerts command:', error);
            await interaction.reply({
                content: 'There was an error setting up the alerts channel!',
                ephemeral: true
            });
        }
    },
};
