/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "Geçerli bir mesaj kimliği sağlamalısınız.";

  // Permissions
  if (!member.permissions.has("ManageMessages")) {
    return "Hediyeleri başlatmak için mesaj izinlerini yönetmeniz gerekir.";
  }

  // Search with messageId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // If no giveaway was found
  if (!giveaway) return `MessageID için bir hediye bulamıyor: ${messageId}`;

  // Check if the giveaway is ended
  if (giveaway.ended) return "Hediye zaten sona erdi.";

  try {
    await giveaway.end();
    return "Başarı!Hediye bitti!";
  } catch (error) {
    member.client.logger.error("Giveaway End", error);
    return `Hediyeyi bitirirken bir hata oluştu: ${error.message}`;
  }
};
