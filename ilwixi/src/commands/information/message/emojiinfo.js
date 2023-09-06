const emojiInfo = require("../shared/emoji");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "emojibilgi",
  description: "Bir emoji hakkında bilgi gösterir",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<emoji>",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const emoji = args[0];
    const response = emojiInfo(emoji);
    await message.safeReply(response);
  },
};
