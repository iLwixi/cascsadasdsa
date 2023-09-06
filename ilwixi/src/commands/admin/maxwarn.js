const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "maxwarn",
  description: "maksimum uyarı yapılandırmasını ayarla",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "limit <number>",
        description: "Bir üyenin bir işlem yapmadan önce alabileceği maksimum uyarıları ayarlayın",
      },
      {
        trigger: "action <timeout|kick|ban>",
        description: "set action to performed after receiving maximum warnings",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "limit",
        description: "Bir üyenin bir işlem yapmadan önce alabileceği maksimum uyarıları ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "max number of strikes",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "action",
        description: "eylemi maksimum uyarı alındıktan sonra gerçekleştirilecek şekilde ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "action",
            description: "gerçekleştirilecek eylem",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: "TIMEOUT",
                value: "TIMEOUT",
              },
              {
                name: "KICK",
                value: "KICK",
              },
              {
                name: "BAN",
                value: "BAN",
              },
            ],
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    if (!["limit", "action"].includes(input)) return message.safeReply("Hatalı kullanım");

    let response;
    if (input === "limit") {
      const max = parseInt(args[1]);
      if (isNaN(max) || max < 1) return message.safeReply("Maksimum Uyarılar 0'dan büyük geçerli bir sayı olmalıdır");
      response = await setLimit(max, data.settings);
    }

    if (input === "action") {
      const action = args[1]?.toUpperCase();
      if (!action || !["TIMEOUT", "KICK", "BAN"].includes(action))
        return message.safeReply("Geçerli bir işlem değil. Doğru kullanım `Timeout`/`Kick`/`Ban`");
      response = await setAction(message.guild, action, data.settings);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();

    let response;
    if (sub === "limit") {
      response = await setLimit(interaction.options.getInteger("amount"), data.settings);
    }

    if (sub === "action") {
      response = await setAction(interaction.guild, interaction.options.getString("action"), data.settings);
    }

    await interaction.followUp(response);
  },
};

async function setLimit(limit, settings) {
  settings.max_warn.limit = limit;
  await settings.save();
  return `Yapılandırma kaydedildi! Maksimum uyarılar şu şekilde ayarlandı: ${limit}`;
}

async function setAction(guild, action, settings) {
  if (action === "TIMEOUT") {
    if (!guild.members.me.permissions.has("ModerateMembers")) {
      return "Üyelerin zaman aşımına izin vermiyorum";
    }
  }

  if (action === "KICK") {
    if (!guild.members.me.permissions.has("KickMembers")) {
      return "Üyeleri atma iznim yok";
    }
  }

  if (action === "BAN") {
    if (!guild.members.me.permissions.has("BanMembers")) {
      return "Üyeleri yasaklama iznim yok";
    }
  }

  settings.max_warn.action = action;
  await settings.save();
  return `Yapılandırma kaydedildi! Otomatik mod eylemi şu şekilde ayarlandı: ${action}`;
}
