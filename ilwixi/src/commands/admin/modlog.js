const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "modlog",
  description: "Moderasyon log kanalını açar yada kapatırsın",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<#kanal|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "mod logları gönderilir",
        required: false,
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    let targetChannel;

    if (input === "none" || input === "off" || input === "disable") targetChannel = null;
    else {
      if (message.mentions.channels.size === 0) return message.safeReply("Yanlış komut kullanımı");
      targetChannel = message.mentions.channels.first();
    }

    const response = await setChannel(targetChannel, data.settings);
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const channel = interaction.options.getChannel("channel");
    const response = await setChannel(channel, data.settings);
    return interaction.followUp(response);
  },
};

async function setChannel(targetChannel, settings) {
  if (!targetChannel && !settings.modlog_channel) {
    return "Zaten kapalı";
  }

  if (targetChannel && !targetChannel.canSendEmbeds()) {
    return "Ah! Bu kanala günlük gönderemiyorum? Bu kanalda `Mesaj Yaz` ve `Bağlantıları Yerleştir` izinlerine ihtiyacım var";
  }

  settings.modlog_channel = targetChannel?.id;
  await settings.save();
  return `Yapılandırma kaydedildi! Modlog kanalı ${targetChannel ? "updated" : "removed"}`;
}
