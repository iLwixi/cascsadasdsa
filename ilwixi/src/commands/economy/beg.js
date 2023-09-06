const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "dilen",
  description: "Birinden yalvar",
  category: "ECONOMY",
  cooldown: 21600,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = await beg(message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await beg(interaction.user);
    await interaction.followUp(response);
  },
};

async function beg(user) {
  let users = [
    "LWEAXO",
    "ZeKe-Hayranı",
    "SoleTwo0",
    "MZR",
    "Enes Batur",
    "Polat Alemdar",
    "Behsat Ç",
    "Laz Zia",
    "Mesut Komser",
    "İsmet",
    "Mr. Beast",
    "Eray Can Özkenar",
    "Elif",
    "Memati",
    "Volkan Konak",
    "LWEAXO",
    "ZeKe-Hayranı",
    "SoleTwo0",
    "MZR",
    "Enes Batur",
    "Polat Alemdar",
    "Behsat Ç",
    "Laz Zia",
    "Mesut Komser",
    "İsmet",
    "Mr. Beast",
  ];

  let amount = Math.floor(Math.random() * `${ECONOMY.MAX_BEG_AMOUNT}` + `${ECONOMY.MIN_BEG_AMOUNT}`);
  const userDb = await getUser(user);
  userDb.coins += amount;
  await userDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(
      `**${users[Math.floor(Math.random() * users.length)]}** sana bağış ayptı **${amount}** ${ECONOMY.CURRENCY}\n` +
        `**Updated Balance:** **${userDb.coins}** ${ECONOMY.CURRENCY}`
    );

  return { embeds: [embed] };
}
