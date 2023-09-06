const { } = require('discord.js');

module.exports = {
    name: 'reload-commands',
    description: 'Tüm komutları yeniden yükleyin.',
    type: 1,
    options: [],
    role_perms: null,
    developers_only: true,
    category: 'administrator',
    run: async (client, interaction, config) => {

        await interaction.reply({
            content: '`•••` Yükleniyor...',
            ephemeral: true
        });

        try {
            require('../../handlers/application_commands')(client, config);

            return interaction.editReply({
                content: '\`✅\` Tüm komutları yükledi, hata bulunmadı.',
                ephemeral: true
            });
        } catch (err) {
            return interaction.editReply({
                content: `\`❌\` Bir hata bulundu:\n${err}`,
                ephemeral: true
            });
        };

    }
};