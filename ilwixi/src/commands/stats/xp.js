const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "seviyeup",
  description: "XP sistemini yapılandırın",
  category: "STATS",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "message <new-message>",
        description: "Özel Seviye Up mesajını ayarlayın",
      },
      {
        trigger: "channel <#channel|off>",
        description: "Kanalı seviye up mesajları göndermek için ayarlayın",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "message",
        description: "Özel Seviye Up mesajını ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message",
            description: "Bir kullanıcı seviyesi yükseldiğinde görüntüleme mesajı",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "channel",
        description: "Kanalı seviye up mesajları göndermek için ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Seviye up mesajları göndermek için kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0];
    const subcommandArgs = args.slice(1);
    let response;

    // message
    if (sub === "message") {
      const message = subcommandArgs.join(" ");
      response = await setMessage(message, data.settings);
    }

    // channel
    else if (sub === "channel") {
      const input = subcommandArgs[0];
      let channel;

      if (input === "off") channel = "off";
      else {
        const match = message.guild.findMatchingChannels(input);
        if (match.length === 0) return message.safeReply("Geçersiz kanal.Lütfen geçerli bir kanal sağlayın");
        channel = match[0];
      }
      response = await setChannel(channel, data.settings);
    }

    // invalid
    else response = "Geçersiz alt komut";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    if (sub === "message") response = await setMessage(interaction.options.getString("message"), data.settings);
    else if (sub === "channel") response = await setChannel(interaction.options.getChannel("channel"), data.settings);
    else response = "Geçersiz alt komut";

    await interaction.followUp(response);
  },
};

async function setMessage(message, settings) {
  if (!message) return "Geçersiz mesaj.Lütfen bir mesaj verin";
  settings.stats.xp.message = message;
  await settings.save();
  return `Yapılandırma kaydedildi.Seviye Up Mesajı Güncellendi!`;
}

async function setChannel(channel, settings) {
  if (!channel) return "Geçersiz kanal.Lütfen bir kanal sağlayın";

  if (channel === "off") settings.stats.xp.channel = null;
  else settings.stats.xp.channel = channel.id;

  await settings.save();
  return `Yapılandırma kaydedildi.Seviye Up kanalı güncellendi!`;
}
