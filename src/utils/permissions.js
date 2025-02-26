const { logger } = require('./logger');

async function checkModPermissions(interaction, permission) {
    if (!interaction.member.permissions.has(permission)) {
        await interaction.reply({
            content: `You don't have the required permissions to use this command! (${permission})`,
            ephemeral: true
        });
        logger.warn(`${interaction.user.tag} attempted to use command without ${permission} permission`);
        return false;
    }
    return true;
}

module.exports = {
    checkModPermissions
};
