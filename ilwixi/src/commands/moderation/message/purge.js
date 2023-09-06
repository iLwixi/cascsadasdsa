const { purgeMessages } = require("@helpers/ModUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "sil",
  description: "Belirtilen mesaj miktarını siler",
  category: "MODERATION",
  userPermissions: ["ManageMessages"],
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  command: {
    enabled: true,
    usage: "<amount>",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const amount = args[0];

    if (isNaN(amount)) return message.safeReply("Sayılar sadece izin verilir");
    if (parseInt(amount) > 99) return message.safeReply("Silebileceğim maksimum mesaj 99");

    const { channel } = message;
    const response = await purgeMessages(message.member, channel, "ALL", amount);

    if (typeof response === "number") {
      return channel.safeSend(`Mesajlar başarıyla silindi ${response} `, 5);
    } else if (response === "BOT_PERM") {
      return message.safeReply("Sahip değilim `Mesaj geçmişini oku` & `Mesajları Yönetin` Mesajları silmek için", 5);
    } else if (response === "MEMBER_PERM") {
      return message.safeReply("Sahipsin `Mesaj geçmişini oku` & `Mesajları Yönetin` Mesajları silmek için", 5);
    } else if (response === "NO_MESSAGES") {
      return channel.safeSend("Temizlenebilecek hiçbir mesaj bulunamadı", 5);
    } else {
      return message.safeReply(`Hata oluştu!Mesajları silemedi`);
    }
  },
};
