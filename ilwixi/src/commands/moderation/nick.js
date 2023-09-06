const { canModerate } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "isim",
  description: "Takma Ad Komutları",
  category: "MODERATION",
  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "set <@member> <name>",
        description: "Belirtilen üyenin takma adını ayarlar",
      },
      {
        trigger: "reset <@member>",
        description: "Bir üye takma adını sıfırla",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "set",
        description: "Bir üye takma adını değiştir",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "Nick'i ayarlamak istediğin üye",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "name",
            description: "ayarlanacak takma ad",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reset",
        description: "Bir üye takma adını sıfırla",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "Nick'i sıfırlamak istediğiniz üyeler",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if (sub === "set") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("Eşleşen membe bulamadımr");
      const name = args.slice(2).join(" ");
      if (!name) return message.safeReply("Lütfen bir takma ad belirtin");

      const response = await nickname(message, target, name);
      return message.safeReply(response);
    }

    //
    else if (sub === "reset") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("Eşleşen üye bulamadım");

      const response = await nickname(message, target);
      return message.safeReply(response);
    }
  },

  async interactionRun(interaction) {
    const name = interaction.options.getString("name");
    const target = await interaction.guild.members.fetch(interaction.options.getUser("user"));

    const response = await nickname(interaction, target, name);
    await interaction.followUp(response);
  },
};

async function nickname({ member, guild }, target, name) {
  if (!canModerate(member, target)) {
    return `Oops!Takma adını yönetemezsin ${target.user.tag}`;
  }
  if (!canModerate(guild.members.me, target)) {
    return `Oops!Takma adını yönetemiyorum ${target.user.tag}`;
  }

  try {
    await target.setNickname(name);
    return `Başarıyla ${name ? "changed" : "reset"} takma adı ${target.user.tag}`;
  } catch (ex) {
    return `Başaramadı ${name ? "change" : "reset"} için takma ad ${target.displayName}. Geçerli bir isim verdin mi?`;
  }
}
