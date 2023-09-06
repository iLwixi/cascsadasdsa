const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "davetkar",
  description: "Davet Sıralarını Yapılandırma",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<rol-ismi> <invites>",
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "add <role> <invites>",
        description: "Belirli sayıda davetiye ulaştıktan sonra otomatik kayın ekleyin",
      },
      {
        trigger: "remove role",
        description: "Bu rolle yapılandırılmış davet sırasını kaldır",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "Yeni bir davet sırası ekleyin",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "verilecek rol",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
          {
            name: "invites",
            description: "Rolü almak için gereken davet sayısı",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Önceden yapılandırılmış bir davet sırasını kaldırın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "Yapılandırılmış Davet Sıralaması ile Rol",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0].toLowerCase();

    if (sub === "add") {
      const query = args[1];
      const invites = args[2];

      if (isNaN(invites)) return message.safeReply(`\`${invites}\` Geçerli bir davet sayısı değil mi?`);
      const role = message.guild.findMatchingRoles(query)[0];
      if (!role) return message.safeReply(`Eşleşen hiçbir rol bulunamadı \`${query}\``);

      const response = await addInviteRank(message, role, invites, data.settings);
      await message.safeReply(response);
    }

    //
    else if (sub === "remove") {
      const query = args[1];
      const role = message.guild.findMatchingRoles(query)[0];
      if (!role) return message.safeReply(`Eşleşen hiçbir rol bulunamadı \`${query}\``);
      const response = await removeInviteRank(message, role, data.settings);
      await message.safeReply(response);
    }

    //
    else {
      await message.safeReply("Yanlış Komut Kullanımı!");
    }
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    //
    if (sub === "add") {
      const role = interaction.options.getRole("role");
      const invites = interaction.options.getInteger("invites");

      const response = await addInviteRank(interaction, role, invites, data.settings);
      await interaction.followUp(response);
    }

    //
    else if (sub === "remove") {
      const role = interaction.options.getRole("role");
      const response = await removeInviteRank(interaction, role, data.settings);
      await interaction.followUp(response);
    }
  },
};

async function addInviteRank({ guild }, role, invites, settings) {
  if (!settings.invite.tracking) return `Bu sunucuda davet izleme devre dışı bırakıldı`;

  if (role.managed) {
    return "Bir bot rolü atayamazsın";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Herkes rolünü atayamıyorum.";
  }

  if (!role.editable) {
    return "Üyeleri bu role taşımak için izinleri kaçırıyorum.Bu rol benim en yüksek rolümün altında mı?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);

  let msg = "";
  if (exists) {
    exists.invites = invites;
    msg += "Bu rol için önceki yapılandırma bulundu.Verilerin üzerine yazma\n";
  }

  settings.invite.ranks.push({ _id: role.id, invites });
  await settings.save();
  return `${msg}Başarı!Yapılandırma kaydedildi.`;
}

async function removeInviteRank({ guild }, role, settings) {
  if (!settings.invite.tracking) return `Bu sunucuda davet izleme devre dışı bırakıldı`;

  if (role.managed) {
    return "Bir bot rolü atayamazsın";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Herkes rolünü atayamazsın.";
  }

  if (!role.editable) {
    return "Üyeleri bu rolden taşımak için izinleri kaçırıyorum.Bu rol benim en yüksek rolümün altında mı?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);
  if (!exists) return "Bu rol için önceki davetiye yapılandırılmadı";

  // delete element from array
  const i = settings.invite.ranks.findIndex((obj) => obj._id === role.id);
  if (i > -1) settings.invite.ranks.splice(i, 1);

  await settings.save();
  return "Başarı!Yapılandırma kaydedildi.";
}
