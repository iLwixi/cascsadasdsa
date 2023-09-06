const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { postToBin } = require("@helpers/HttpUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "paste",
  description: "Sourceb.in'de bir şey yapıştırın",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 2,
    usage: "<başlık> <içerik>",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "title",
        description: "İçeriğiniz için başlık",
        required: true,
        type: ApplicationCommandOptionType.String,
      },
      {
        name: "content",
        description: "Bin'e gönderilecek içerik",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const title = args.shift();
    const content = args.join(" ");
    const response = await paste(content, title);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const title = interaction.options.getString("başlık");
    const content = interaction.options.getString("içerik");
    const response = await paste(content, title);
    await interaction.followUp(response);
  },
};

async function paste(content, title) {
  const response = await postToBin(content, title);
  if (!response) return "❌ Bir şeyler ters gitti";

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Paste link" })
    .setDescription(`🔸 Normal: ${response.url}\n🔹 Raw: ${response.raw}`);

  return { embeds: [embed] };
}
