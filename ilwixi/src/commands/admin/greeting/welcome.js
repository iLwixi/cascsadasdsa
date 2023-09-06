const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "hosgeldin",
  description: "Hoşgeldin kanalı ayarlarsın",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "status <açık|kapalı>",
        description: "Hoş Geldiniz Mesajını Etkinleştir veya Devre Dışı Bırak",
      },
      {
        trigger: "channel <#kanal>",
        description: "Hoş Geldiniz Mesajını Yapılandırın",
      },
      {
        trigger: "preview",
        description: "Yapılandırılmış hoş geldiniz mesajını önizleme",
      },
      {
        trigger: "desc <text>",
        description: "Gömme Açıklamasını Set",
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
        description: "Gömme altbilgi içeriğini ayarlayın",
      },
      {
        trigger: "image <url>",
        description: "Gömme Görüntüyü Ayarla",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "Hoş Geldiniz Mesajını Etkinleştir veya Devre Dışı Bırak",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "Etkin veya devre dışı",
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Etkinleştir",
                value: "ON",
              },
              {
                name: "Devre Dışı",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "preview",
        description: "Yapılandırılmış hoş geldiniz mesajını önizleme",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "Karşılama Kanalı'nı ayarlayın",
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
        description: "Gömme Açıklamasını Set",
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
                name: "Aç",
                value: "ON",
              },
              {
                name: "Kapat",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "color",
        description: "Gömme Rengi Ayarla",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex-code",
            description: "hex renk kodu",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "footer",
        description: "Alt Bilgi içeriği",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "Alt Bilgi",
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
        return message.safeReply("Geçersiz durum.Değer olmalı `on/off`");
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
        return message.safeReply("Geçersiz durum.Değer olmalı `on/off`");
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
        response = await setStatus(settings, interaction.options.getString("durum"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("kanal"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("içerik"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("durum"));
        break;

      case "color":
        response = await setColor(settings, interaction.options.getString("renk"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("içerik"));
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
  if (!settings.welcome?.enabled) return "Hoş Geldiniz Bu Sunucuda Etkinleştirilmiyor";

  const targetChannel = member.guild.channels.cache.get(settings.welcome.channel);
  if (!targetChannel) return "Hoş Geldiniz Mesajı Gönderecek Kanal Yapılandırılmadı";

  const response = await buildGreeting(member, "WELCOME", settings.welcome);
  await targetChannel.safeSend(response);

  return `Hoş Geldiniz Önizlemesini Gönderdi ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.welcome.enabled = enabled;
  await settings.save();
  return `Yapılandırma kaydedildi!Karşılama mesajı ${enabled ? "aktif" : "aktif değil"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "Ugh!O kanala selam gönderemiyorum? `Mesaj Yaz` ve `Bağlantıları Göm` İzinlerine ihtiyacım var! " +
      channel.toString()
    );
  }
  settings.welcome.channel = channel.id;
  await settings.save();
  return `Yapılandırma kaydedildi!Hoş geldiniz mesajı şu kanala gönderilecek ${channel ? channel.toString() : "bilinmiyor"}`;
}

async function setDescription(settings, desc) {
  settings.welcome.embed.description = desc;
  await settings.save();
  return "Yapılandırma kaydedildi!Hoş Geldiniz Mesajı Güncellendi";
}

async function setThumbnail(settings, status) {
  settings.welcome.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Yapılandırma kaydedildi!Hoş Geldiniz Mesajı Güncellendi";
}

async function setColor(settings, color) {
  settings.welcome.embed.color = color;
  await settings.save();
  return "Yapılandırma kaydedildi!Hoş Geldiniz Mesajı Güncellendi";
}

async function setFooter(settings, content) {
  settings.welcome.embed.footer = content;
  await settings.save();
  return "Yapılandırma kaydedildi! Hoş geldiniz mesajı güncellendi";
}

async function setImage(settings, url) {
  settings.welcome.embed.image = url;
  await settings.save();
  return "Yapılandırma kaydedildi! Hoş geldiniz mesajı güncellendi";
}
