const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkModPermissions } = require('../../utils/permissions');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createcategory')
        .setDescription('Create a new category')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Category name')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            if (!await checkModPermissions(interaction, 'ManageChannels')) return;

            const name = interaction.options.getString('name');

            const category = await interaction.guild.channels.create({
                name: name,
                type: ChannelType.GuildCategory
            });

            logger.info(`${interaction.user.tag} created category ${category.name}`);

            await interaction.reply({
                content: `Successfully created category: ${category.name}`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('Error in createcategory command:', error);
            await interaction.reply({
                content: 'There was an error creating the category!',
                ephemeral: true
            });
        }
    },
};
