/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "You must provide a valid message id.";

  // Permissions
  if (!member.permissions.has("ManageMessages")) {
    return "Eşantiyonları başlatmak için mesaj izinlerini yönetmeniz gerekiyor.";
  }

  // Search with messageId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // If no giveaway was found
  if (!giveaway) return `MessageID için bir hediye bulamıyor: ${messageId}`;

  // Check if the giveaway is ended
  if (!giveaway.ended) return "Hediye henüz bitmedi.";

  try {
    await giveaway.reroll();
    return "Hediye yeniden yönlendirildi!";
  } catch (error) {
    member.client.logger.error("Giveaway Reroll", error);
    return `Hediyeyi yeniden yönlendirirken bir hata oluştu: ${error.message}`;
  }
};
