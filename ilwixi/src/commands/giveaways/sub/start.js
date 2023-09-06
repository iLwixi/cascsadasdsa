const { ChannelType } = require("discord.js");

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').GuildTextBasedChannel} giveawayChannel
 * @param {number} duration
 * @param {string} prize
 * @param {number} winners
 * @param {import('discord.js').User} [host]
 * @param {string[]} [allowedRoles]
 */
module.exports = async (member, giveawayChannel, duration, prize, winners, host, allowedRoles = []) => {
  try {
    if (!host) host = member.user;
    if (!member.permissions.has("ManageMessages")) {
      return "Çekilişleri başlatmak için mesaj izinlerini yönetmeniz gerekiyor.";
    }

    if (!giveawayChannel.type === ChannelType.GuildText) {
      return "Sadece metin kanallarında hediye başlayabilirsiniz.";
    }

    /**
     * @type {import("discord-giveaways").GiveawayStartOptions}
     */
    const options = {
      duration: duration,
      prize,
      winnerCount: winners,
      hostedBy: host,
      thumbnail: "https://i.imgur.com/DJuTuxs.png",
      messages: {
        giveaway: "🎉 **ÇEKİLİŞ** 🎉",
        giveawayEnded: "🎉 **Çekiliş Bitti** 🎉",
        inviteToParticipate: "Girmek için 🎁 ile tepki ver",
        dropMessage: "Kazanmak için ilk tepki 🎁 veren kişi olun!",
        hostedBy: `\nÇekilişi Sağlayan: ${host.tag}`,
      },
    };

    if (allowedRoles.length > 0) {
      options.exemptMembers = (member) => !member.roles.cache.find((role) => allowedRoles.includes(role.id));
    }

    await member.client.giveawaysManager.start(giveawayChannel, options);
    return `Çekiliş Başladı ${giveawayChannel}`;
  } catch (error) {
    member.client.logger.error("Giveaway Start", error);
    return `Hediye başlarken bir hata oluştu: ${error.message}`;
  }
};
