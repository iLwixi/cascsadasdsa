const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "baybay",
  description: "Kurulum Veda Mesajı",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "durum <açık|kapalı>",
        description: "veda mesajını etkinleştir veya devre dışı bırak",
      },
      {
        trigger: "channel <#kanal>",
        description: "veda mesajını yapılandırın",
      },
      {
        trigger: "preview",
        description: "Yapılandırılmış veda mesajını önizleme",
      },
      {
        trigger: "desc <text>",
        description: "Embed Açıklamasını Ayarlarsınız",
      },
      {
        trigger: "thumbnail <AÇIK|KAPALI>",
        description: "Küçük resimleri etkinleştir/devre dışı bırak",
      },
      {
        trigger: "color <hexcolor>",
        description: "Gömme Rengi Ayarla",
      },
      {
        trigger: "footer <text>",
        description: "Embed altbilgi içeriğini ayarlayın",
      },
      {
        trigger: "image <url>",
        description: "embed görselini düzenlersiniz",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "veda mesajını etkinleştir veya devre dışı bırak",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "Açık Veya Kapalı",
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "AKTİF",
                value: "ON",
              },
              {
                name: "KAPALI",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "preview",
        description: "Yapılandırılmış veda mesajını önizleme",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "veda kanalını ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Kanal ismi",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "desc",
        description: "embed açıklamasını ayarlarsınız",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "Açıklama İçeriği",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "thumbnail",
        description: "Küçük resimleri yapılandırın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "küçük resim statüsü",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: "AÇIK",
                value: "ON",
              },
              {
                name: "KAPALI",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "color",
        description: "Embed rengi ayarlarsınız",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex-code",
            description: "hex color kodu",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "footer",
        description: "Gömme altbilgisini ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "altbilgi içeriği",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "image",
        description: "Gömme Görüntüyü Ayarla",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "url",
            description: "Resim URL",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    const settings = data.settings;
    let response;

    // preview
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // status
    else if (type === "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Geçersiz durum.Değer olmalı `açık/kapalı`");
      response = await setStatus(settings, status);
    }

    // channel
    else if (type === "channel") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // desc
    else if (type === "desc") {
      if (args.length < 2) return message.safeReply("Yetersiz argümanlar!Lütfen geçerli içerik sağlayın");
      const desc = args.slice(1).join(" ");
      response = await setDescription(settings, desc);
    }

    // thumbnail
    else if (type === "thumbnail") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Geçersiz durum.Değer olmalı `açık/kapalı`");
      response = await setThumbnail(settings, status);
    }

    // color
    else if (type === "color") {
      const color = args[1];
      if (!color || !isHex(color)) return message.safeReply("Geçersiz renk.Değer geçerli bir onaltılık rengi olmalı");
      response = await setColor(settings, color);
    }

    // footer
    else if (type === "footer") {
      if (args.length < 2) return message.safeReply("Yetersiz argümanlar!Lütfen geçerli içerik sağlayın");
      const content = args.slice(1).join(" ");
      response = await setFooter(settings, content);
    }

    // image
    else if (type === "image") {
      const url = args[1];
      if (!url) return message.safeReply("Geçersiz görüntü URL'si.Lütfen geçerli bir URL sağlayın");
      response = await setImage(settings, url);
    }

    //
    else response = "Geçersiz Komut Kullanımı!";
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    switch (sub) {
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("channel"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("content"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("status"));
        break;

      case "color":
        response = await setColor(settings, interaction.options.getString("color"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("content"));
        break;

      case "image":
        response = await setImage(settings, interaction.options.getString("url"));
        break;

      default:
        response = "Geçersiz alt komut";
    }

    return interaction.followUp(response);
  },
};

async function sendPreview(settings, member) {
  if (!settings.farewell?.enabled) return "Bu sunucuda veda mesajı etkinleştirilmedi";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "Veda mesajı gönderecek hiçbir kanal yapılandırılmadı";

  const response = await buildGreeting(member, "FAREWELL", settings.farewell);
  await targetChannel.safeSend(response);

  return `Sent farewell preview to ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `Yapılandırma kaydedildi!Elveda mesajı ${status ? "aktif" : "devre dışı"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "Ugh!O kanala selam gönderemiyorum?`` Mesajlar yaz '' ve `` linkler '' izinlerine ihtiyacım var " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `Yapılandırma kaydedildi!Veda mesajı gönderilecek ${channel ? channel.toString() : "Bulunamadı"}`;
}

async function setDescription(settings, desc) {
  settings.farewell.embed.description = desc;
  await settings.save();
  return "Yapılandırma kaydedildi!Veda mesajı güncellendi";
}

async function setThumbnail(settings, status) {
  settings.farewell.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Yapılandırma kaydedildi!Veda mesajı güncellendi";
}

async function setColor(settings, color) {
  settings.farewell.embed.color = color;
  await settings.save();
  return "Yapılandırma kaydedildi!Veda mesajı güncellendi";
}

async function setFooter(settings, content) {
  settings.farewell.embed.footer = content;
  await settings.save();
  return "Yapılandırma kaydedildi!Veda mesajı güncellendi";
}

async function setImage(settings, url) {
  settings.farewell.embed.image = url;
  await settings.save();
  return "Yapılandırma kaydedildi!Veda mesajı güncellendi";
}
