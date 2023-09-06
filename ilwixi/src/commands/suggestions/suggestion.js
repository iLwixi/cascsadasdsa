const { approveSuggestion, rejectSuggestion } = require("@handlers/suggestion");
const { parsePermissions } = require("@helpers/Utils");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

const CHANNEL_PERMS = ["ViewChannel", "SendMessages", "EmbedLinks", "ManageMessages", "ReadMessageHistory"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "öner",
  description: "Öneri Sistemini Yapılandırma",
  category: "SUGGESTION",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "status <aç|kapat>",
        description: "Öneri Sistemini Etkinleştir/Devre Dışı Bırak",
      },
      {
        trigger: "channel <#channel|off>",
        description: "Öneri kanalını yapılandırın veya devre dışı bırakın",
      },
      {
        trigger: "appch <#channel>",
        description: "Onaylı Öneriler Kanalını Yapılandırın veya Devre Dışı Bırakın",
      },
      {
        trigger: "rejch <#channel>",
        description: "Reddedilen öneriler kanalını yapılandırın veya devre dışı bırakın",
      },
      {
        trigger: "approve <channel> <messageId> [reason]",
        description: "Bir öneri onaylayın",
      },
      {
        trigger: "reject <channel> <messageId> [reason]",
        description: "Bir öneri reddet",
      },
      {
        trigger: "staffadd <roleId>",
        description: "Bir personel rolü ekleyin",
      },
      {
        trigger: "staffremove <roleId>",
        description: "Bir personel rolünü kaldır",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "Öneri Durumunu Etkinleştir veya Devre Dışı Bırak",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "Etkin veya devre dışı",
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
      {
        name: "channel",
        description: "Öneri kanalını yapılandırın veya devre dışı bırakın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "Önerilerin gönderileceği kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "appch",
        description: "Onaylı Öneriler Kanalını Yapılandırın veya Devre Dışı Bırakın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "onaylanan önerilerin gönderileceği kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "rejch",
        description: "Reddedilen öneriler kanalını yapılandırın veya devre dışı bırakın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "reddedilen önerilerin gönderileceği kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "approve",
        description: "Bir öneri onaylayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "Mesajın bulunduğu kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: "message_id",
            description: "Önerinin mesaj kimliği",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "reason",
            description: "onay nedeni",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "reject",
        description: "Bir öneri reddet",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "Mesajın bulunduğu kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: "message_id",
            description: "Önerinin mesaj kimliği",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "reason",
            description: "Reddetmenin nedeni",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "staffadd",
        description: "Bir personel rolü ekleyin",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "Personel olarak eklenecek rol",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: "staffremove",
        description: "Staffremove bir personel rolü",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "bir personelden personelin rolü",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0];
    let response;

    // status
    if (sub == "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Geçersiz durum.Değer olmalı `on/off`");
      response = await setStatus(data.settings, status);
    }

    // channel
    else if (sub == "channel") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `Eşleşen kanal bulunamadı ${input}`;
      else if (matched.length > 1) response = `Birden fazla kanal için bulundu ${input}. Lütfen daha spesifik ol.`;
      else response = await setChannel(data.settings, matched[0]);
    }

    // appch
    else if (sub == "appch") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `Eşleşen kanal bulunamadı ${input}`;
      else if (matched.length > 1) response = `Birden fazla kanal için bulundu ${input}. Lütfen daha spesifik ol.`;
      else response = await setApprovedChannel(data.settings, matched[0]);
    }

    // appch
    else if (sub == "rejch") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `Eşleşen kanal bulunamadı ${input}`;
      else if (matched.length > 1) response = `Birden fazla kanal için bulundu ${input}. Lütfen daha spesifik ol.`;
      else response = await setRejectedChannel(data.settings, matched[0]);
    }

    // approve
    else if (sub == "approve") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `Eşleşen kanal bulunamadı ${input}`;
      else if (matched.length > 1) response = `Birden fazla kanal için bulundu ${input}. Lütfen daha spesifik ol.`;
      else {
        const messageId = args[2];
        const reason = args.slice(3).join(" ");
        response = await approveSuggestion(message.member, matched[0], messageId, reason);
      }
    }

    // reject
    else if (sub == "reject") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `Eşleşen kanal bulunamadı ${input}`;
      else if (matched.length > 1) response = `Birden fazla kanal için bulundu ${input}. Lütfen daha spesifik ol.`;
      else {
        const messageId = args[2];
        const reason = args.slice(3).join(" ");
        response = await rejectSuggestion(message.member, matched[0], messageId, reason);
      }
    }

    // staffadd
    else if (sub == "staffadd") {
      const input = args[1];
      let matched = message.guild.findMatchingRoles(input);
      if (matched.length == 0) response = `Eşleşen rol bulunamadı ${input}`;
      else if (matched.length > 1) response = `İçin çoklu rol bulundu ${input}. Lütfen daha spesifik ol.`;
      else response = await addStaffRole(data.settings, matched[0]);
    }

    // staffremove
    else if (sub == "staffremove") {
      const input = args[1];
      let matched = message.guild.findMatchingRoles(input);
      if (matched.length == 0) response = `Eşleşen rol bulunamadı ${input}`;
      else if (matched.length > 1) response = `İçin çoklu rol bulundu ${input}. Lütfen daha spesifik ol.`;
      else response = await removeStaffRole(data.settings, matched[0]);
    }

    // else
    else response = "Not a valid subcommand";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // status
    if (sub == "status") {
      const status = interaction.options.getString("status");
      response = await setStatus(data.settings, status);
    }

    // channel
    else if (sub == "channel") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setChannel(data.settings, channel);
    }

    // app_channel
    else if (sub == "appch") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setApprovedChannel(data.settings, channel);
    }

    // rej_channel
    else if (sub == "rejch") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setRejectedChannel(data.settings, channel);
    }

    // approve
    else if (sub == "approve") {
      const channel = interaction.options.getChannel("channel_name");
      const messageId = interaction.options.getString("message_id");
      response = await approveSuggestion(interaction.member, channel, messageId);
    }

    // reject
    else if (sub == "reject") {
      const channel = interaction.options.getChannel("channel_name");
      const messageId = interaction.options.getString("message_id");
      response = await rejectSuggestion(interaction.member, channel, messageId);
    }

    // staffadd
    else if (sub == "staffadd") {
      const role = interaction.options.getRole("role");
      response = await addStaffRole(data.settings, role);
    }

    // staffremove
    else if (sub == "staffremove") {
      const role = interaction.options.getRole("role");
      response = await removeStaffRole(data.settings, role);
    }

    // else
    else response = "Geçerli bir alt komut değil";
    await interaction.followUp(response);
  },
};

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.suggestions.enabled = enabled;
  await settings.save();
  return `Öneri sistemi şimdi ${enabled ? "Aktif" : "Devre Dışı"}`;
}

async function setChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.channel_id = null;
    await settings.save();
    return "Öneri sistemi artık devre dışı bırakıldı";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Aşağıdaki izinlere ihtiyacım var ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.channel_id = channel.id;
  await settings.save();
  return `Öneriler şimdi gönderilecek ${channel}`;
}

async function setApprovedChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.approved_channel = null;
    await settings.save();
    return "Öneri onaylı kanal artık devre dışı bırakıldı";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Aşağıdaki izinlere ihtiyacım var ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.approved_channel = channel.id;
  await settings.save();
  return `Onaylı öneriler şimdi gönderilecek ${channel}`;
}

async function setRejectedChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.rejected_channel = null;
    await settings.save();
    return "Öneri Reddedilen Kanal artık devre dışı bırakıldı";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Aşağıdaki izinlere ihtiyacım var ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.rejected_channel = channel.id;
  await settings.save();
  return `Reddedilen öneriler şimdi gönderilecek ${channel}`;
}

async function addStaffRole(settings, role) {
  if (settings.suggestions.staff_roles.includes(role.id)) {
    return `\`${role.name}\` zaten bir personel rolü`;
  }
  settings.suggestions.staff_roles.push(role.id);
  await settings.save();
  return `\`${role.name}\` şimdi bir personel rolü`;
}

async function removeStaffRole(settings, role) {
  if (!settings.suggestions.staff_roles.includes(role.id)) {
    return `${role} bir personel rolü değil`;
  }
  settings.suggestions.staff_roles.splice(settings.suggestions.staff_roles.indexOf(role.id), 1);
  await settings.save();
  return `\`${role.name}\` artık bir personel rolü değil`;
}
