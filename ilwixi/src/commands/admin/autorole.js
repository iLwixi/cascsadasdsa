const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "otorol",
  description: "Bir üye sunucuya katıldığında kurulum rolü verilecek",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<role|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "Oto Rol'u kurun",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "verilecek rol",
            type: ApplicationCommandOptionType.Role,
            required: false,
          },
          {
            name: "role_id",
            description: "verilecek rol kimliği `id`",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "Oto Rol'u devre dışı bırakın",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "off") {
      response = await setAutoRole(message, null, data.settings);
    } else {
      const roles = message.guild.findMatchingRoles(input);
      if (roles.length === 0) response = "Sorgunuzla eşleşen eşleşen rol bulunamadı";
      else response = await setAutoRole(message, roles[0], data.settings);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // add
    if (sub === "add") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Lütfen bir rol veya rol kimliği sağlayın");

        const roles = interaction.guild.findMatchingRoles(role_id);
        if (roles.length === 0) return interaction.followUp("Sorgunuzla eşleşen eşleşen rol bulunamadı");
        role = roles[0];
      }

      response = await setAutoRole(interaction, role, data.settings);
    }

    // remove
    else if (sub === "kaldırmak") {
      response = await setAutoRole(interaction, null, data.settings);
    }

    // default
    else response = "Geçersiz alt komut";

    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} message
 * @param {import("discord.js").Role} role
 * @param {import("@models/Guild")} settings
 */
async function setAutoRole({ guild }, role, settings) {
  if (role) {
    if (role.id === guild.roles.everyone.id) return "Hey `@everyone` Rolünü Oto Rol olarak veremezsin!";
    if (!guild.members.me.permissions.has("ManageRoles")) return "Hey ``Rolleri Yönet` iznine sahip değilim!";
    if (guild.members.me.roles.highest.position < role.position)
      return "Bu rolü atama izinlerim yok";
    if (role.managed) return "Oops!Bu rol bir entegrasyonla yönetilir";
  }

  if (!role) settings.autorole = null;
  else settings.autorole = role.id;

  await settings.save();
  return `Yapılandırma kaydedildi!Oto Rol ${!role ? "kapandı" : "kuruldu"}`;
}
