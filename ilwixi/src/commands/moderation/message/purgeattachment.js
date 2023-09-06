const { purgeMessages } = require("@helpers/ModUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purgeattach",
  description: "belirtilen mesaj miktarını eklerle siler",
  category: "MODERATION",
  userPermissions: ["ManageMessages"],
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  command: {
    enabled: true,
    usage: "[amount]",
    aliases: ["purgeattachment", "purgeattachments"],
  },

  async messageRun(message, args) {
    const amount = args[0] || 99;

    if (amount) {
      if (isNaN(amount)) return message.safeReply("Sayılar sadece izin verilir");
      if (parseInt(amount) > 150) return message.safeReply("Silebileceğim maksimum mesaj 150");
    }

    const { channel } = message;
    const response = await purgeMessages(message.member, message.channel, "ATTACHMENT", amount);

    if (typeof response === "number") {
      return channel.safeSend(`Mesajlar başarıyla silindi ${response} `, 5);
    } else if (response === "BOT_PERM") {
      return message.safeReply("Mesajları silmek için `` Mesaj Geçmişini Oku '' ve `` Mesajları Yönetin ''", 5);
    } else if (response === "MEMBER_PERM") {
      return message.safeReply("Mesajları silmek için `` Mesaj Geçmişini Oku '' ve `` Mesajları Yönetin ''", 5);
    } else if (response === "NO_MESSAGES") {
      return channel.safeSend("Temizlenebilecek hiçbir mesaj bulunamadı", 5);
    } else {
      return message.safeReply(`Hata oluştu!Mesajları silemedi`);
    }
  },
};
