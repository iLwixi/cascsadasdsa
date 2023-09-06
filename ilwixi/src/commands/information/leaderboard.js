const { EmbedBuilder, escapeInlineCode, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getInvitesLb } = require("@schemas/Member");
const { getXpLb } = require("@schemas/MemberStats");
const { getReputationLb } = require("@schemas/User");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "lidertablosu",
  description: "XP Lider Tablosunu görüntüleyin",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["lb"],
    minArgsCount: 1,
    usage: "<xp|invite|rep>",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "type",
        description: "Görüntülenecek liderlik türü",
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "xp",
            value: "xp",
          },
          {
            name: "invite",
            value: "invite",
          },
          {
            name: "rep",
            value: "rep",
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    let response;

    if (type === "xp") response = await getXpLeaderboard(message, message.author, data.settings);
    else if (type === "invite") response = await getInviteLeaderboard(message, message.author, data.settings);
    else if (type === "rep") response = await getRepLeaderboard(message.author);
    else response = "Geçersiz Liderlik Teli Tipi.`Xp` veya` `davet edin`";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const type = interaction.options.getString("type");
    let response;

    if (type === "xp") response = await getXpLeaderboard(interaction, interaction.user, data.settings);
    else if (type === "invite") response = await getInviteLeaderboard(interaction, interaction.user, data.settings);
    else if (type === "rep") response = await getRepLeaderboard(interaction.user);
    else response = "Geçersiz Liderlik Teli Tipi.Ya seç `xp` veya `invite`";

    await interaction.followUp(response);
  },
};

async function getXpLeaderboard({ guild }, author, settings) {
  if (!settings.stats.enabled) return "Bu sunucuda sıralama devre dışı bırakıldı";

  const lb = await getXpLb(guild.id, 10);
  if (lb.length === 0) return "Lider tablosundaki kullanıcı yok";

  let collector = "";
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id);
      collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)}\n`;
    } catch (ex) {
      // Ignore
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "XP Liderler Sıralaması" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Tarafından talep edildi ${author.tag}` });

  return { embeds: [embed] };
}

async function getInviteLeaderboard({ guild }, author, settings) {
  if (!settings.invite.tracking) return "Davet İzleme bu sunucuda devre dışı bırakıldı";

  const lb = await getInvitesLb(guild.id, 10);
  if (lb.length === 0) return "Lider tablosundaki kullanıcı yok";

  let collector = "";
  for (let i = 0; i < lb.length; i++) {
    try {
      const memberId = lb[i].member_id;
      if (memberId === "VANITY") collector += `**#${(i + 1).toString()}** - Vanity URL [${lb[i].invites}]\n`;
      else {
        const user = await author.client.users.fetch(lb[i].member_id);
        collector += `**#${(i + 1).toString()}** - ${escapeInlineCode(user.tag)} [${lb[i].invites}]\n`;
      }
    } catch (ex) {
      collector += `**#${(i + 1).toString()}** - SilinmişKullanıcı#0000 [${lb[i].invites}]\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Lider Tahtayı Davet Edin" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Tarafından talep edildi ${author.tag}` });

  return { embeds: [embed] };
}

async function getRepLeaderboard(author) {
  const lb = await getReputationLb(10);
  if (lb.length === 0) return "Lider tablosundaki kullanıcı yok";

  const collector = lb
    .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} (${user.reputation?.received})`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setAuthor({ name: "İtibar Lider Tahtası" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Tarafından talep edildi ${author.tag}` });

  return { embeds: [embed] };
}
