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

  // Check if the giveaway is paused
  if (giveaway.pauseOptions.isPaused) return "Bu hediye zaten duraklatıldı.";

  try {
    await giveaway.pause();
    return "Başarı!Hediye durakladı!";
  } catch (error) {
    member.client.logger.error("Giveaway Pause", error);
    return `Hediyeyi duraklatırken bir hata oluştu: ${error.message}`;
  }
};
