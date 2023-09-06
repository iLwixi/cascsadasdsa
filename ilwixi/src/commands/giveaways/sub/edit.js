/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 * @param {number} addDuration
 * @param {string} newPrize
 * @param {number} newWinnerCount
 */
module.exports = async (member, messageId, addDuration, newPrize, newWinnerCount) => {
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

  try {
    await member.client.giveawaysManager.edit(messageId, {
      addTime: addDuration || 0,
      newPrize: newPrize || giveaway.prize,
      newWinnerCount: newWinnerCount || giveaway.winnerCount,
    });

    return `Hediye başarıyla güncellendi!`;
  } catch (error) {
    member.client.logger.error("Giveaway Edit", error);
    return `Hediye güncellenirken bir hata oluştu: ${error.message}`;
  }
};
