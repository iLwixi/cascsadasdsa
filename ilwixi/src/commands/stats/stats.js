const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getMemberStats } = require("@schemas/MemberStats");
const { EMBED_COLORS } = require("@root/config");
const { stripIndents } = require("common-tags");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "profil",
  description: "Bu Sunucudaki Üyelerin İstatistiklerine Bakarsınız",
  cooldown: 5,
  category: "STATS",
  command: {
    enabled: true,
    usage: "[@member|id]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "target user",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args, data) {
    const target = (await message.guild.resolveMember(args[0])) || message.member;
    const response = await stats(target, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const member = interaction.options.getMember("user") || interaction.member;
    const response = await stats(member, data.settings);
    await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {object} settings
 */
async function stats(member, settings) {
  if (!settings.stats.enabled) return "Bu sunucuda istatistik izleme devre dışı bırakıldı";
  const memberStats = await getMemberStats(member.guild.id, member.id);

  const embed = new EmbedBuilder()
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addFields(
      {
        name: "User Tag",
        value: member.user.tag,
        inline: true,
      },
      {
        name: "ID",
        value: member.id,
        inline: true,
      },
      {
        name: "⌚ Sunucuya Katılma Tarihi",
        value: member.joinedAt.toLocaleString(),
        inline: false,
      },
      {
        name: "💬 Gönderilen mesajlar",
        value: stripIndents`
      ❯ Gönderilen mesajlar: ${memberStats.messages}
      ❯ Önek komutları: ${memberStats.commands.prefix}
      ❯ Slash komutları: ${memberStats.commands.slash}
      ❯ XP Kazanıldı: ${memberStats.xp}
      ❯ Mevcut seviye: ${memberStats.level}
    `,
        inline: false,
      },
      {
        name: "🎙️ Sesli istatistikler",
        value: stripIndents`
      ❯ Toplam bağlantılar: ${memberStats.voice.connections}
      ❯ Harcanan zaman: ${Math.floor(memberStats.voice.time / 60)} min
    `,
      }
    )
    .setFooter({ text: "Oluşturulan istatistiklerendi" })
    .setTimestamp();


  return { embeds: [embed] };
}
