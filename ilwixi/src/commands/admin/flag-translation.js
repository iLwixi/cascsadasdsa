const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bayrakceviri",
  description: "Sunucuda bayrak çevirisini yapılandırın",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["flagtr"],
    minArgsCount: 1,
    usage: "<on|off>",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "Aktif veya Devredışı",
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Aktif",
            value: "ON",
          },
          {
            name: "Devre dışı",
            value: "OFF",
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const status = args[0].toLowerCase();
    if (!["on", "off"].includes(status)) return message.safeReply("Geçersiz durum. Değer `açık/kapalı` olmalıdır`");

    const response = await setFlagTranslation(status, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const response = await setFlagTranslation(interaction.options.getString("status"), data.settings);
    await interaction.followUp(response);
  },
};

async function setFlagTranslation(input, settings) {
  const status = input.toLowerCase() === "on" ? true : false;

  settings.flag_translation.enabled = status;
  await settings.save();

  return `Yapılandırma kaydedildi! Bayrak çevirisi artık yapılıyor ${status ? "enabled" : "disabled"}`;
}
