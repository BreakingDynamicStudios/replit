const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('investigation-start')
        .setDescription('Start a new investigation channel')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the investigation')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for starting the investigation')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const title = interaction.options.getString('title');
            const reason = interaction.options.getString('reason');

            // Find or create Investigations category
            let investigationsCategory = interaction.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && 
                c.name === 'Investigations'
            );

            if (!investigationsCategory) {
                investigationsCategory = await interaction.guild.channels.create({
                    name: 'Investigations',
                    type: ChannelType.GuildCategory
                });
                logger.info(`Created Investigations category`);
            }

            // Create investigation channel with formatted name
            const channelName = `investigation-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: investigationsCategory.id
            });

            // Create buttons for investigation management
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('investigation_claim')
                        .setLabel('Claim Investigation')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('👋'),
                    new ButtonBuilder()
                        .setCustomId('investigation_close')
                        .setLabel('Close Investigation')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            // Send initial investigation information with buttons
            await channel.send({
                content: `**Investigation: ${title}**\n**Reason:** ${reason}\n**Started by:** ${interaction.user}`,
                components: [row]
            });

            logger.info(`${interaction.user.tag} started investigation channel ${channel.name}`);

            await interaction.reply({
                content: `Investigation channel created: ${channel}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in investigation-start command:', error);
            await interaction.reply({
                content: 'There was an error creating the investigation channel!',
                ephemeral: true
            });
        }
    },
};