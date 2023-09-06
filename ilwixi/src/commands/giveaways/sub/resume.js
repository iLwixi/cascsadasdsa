/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "Geçerli bir mesaj kimliği sağlamalısınız.";

  // Permissions
  if (!member.permissions.has("ManageMessages")) {
    return "Hediyeleri yönetmek için mesaj izinlerini yönetmeniz gerekir.";
  }

  // Search with messageId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // If no giveaway was found
  if (!giveaway) return `MessageID için bir hediye bulamıyor: ${messageId}`;

  // Check if the giveaway is unpaused
  if (!giveaway.pauseOptions.isPaused) return "Bu hediye duraklatılmadı.";

  try {
    await giveaway.unpause();
    return "Başarı!Hediye Papated!";
  } catch (error) {
    member.client.logger.error("Giveaway Resume", error);
    return `Hediye Çıktığında Bir Hata Oldu: ${error.message}`;
  }
};
