const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case-open')
        .setDescription('Open a new case channel')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the case')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for opening the case')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const title = interaction.options.getString('title');
            const reason = interaction.options.getString('reason');

            // Find or create Cases category
            let casesCategory = interaction.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && 
                c.name === 'Cases'
            );

            if (!casesCategory) {
                casesCategory = await interaction.guild.channels.create({
                    name: 'Cases',
                    type: ChannelType.GuildCategory
                });
                logger.info(`Created Cases category`);
            }

            // Create case channel with formatted name
            const channelName = `case-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: casesCategory.id
            });

            // Send initial case information
            await channel.send(`**Case: ${title}**\n**Reason:** ${reason}\n**Opened by:** ${interaction.user}`);

            logger.info(`${interaction.user.tag} opened case channel ${channel.name}`);

            await interaction.reply({
                content: `Case channel created: ${channel}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in case-open command:', error);
            await interaction.reply({
                content: 'There was an error creating the case channel!',
                ephemeral: true
            });
        }
    },
};