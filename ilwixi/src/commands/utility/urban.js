const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");
const moment = require("moment");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "urban",
  description: "Kentsel sözlüğü arar",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<word>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "word",
        description: "Kentsel anlamı istediğiniz kelime",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const word = args.join(" ");
    const response = await urban(word);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const word = interaction.options.getString("word");
    const response = await urban(word);
    await interaction.followUp(response);
  },
};

async function urban(word) {
  const response = await getJson(`http://api.urbandictionary.com/v0/define?term=${word}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  if (!json.list[0]) return `Hiçbir şey eşleşti \`${word}\``;

  const data = json.list[0];
  const embed = new EmbedBuilder()
    .setTitle(data.word)
    .setURL(data.permalink)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`**Tanım**\`\`\`css\n${data.definition}\`\`\``)
    .addFields(
      {
        name: "Author",
        value: data.author,
        inline: true,
      },
      {
        name: "ID",
        value: data.defid.toString(),
        inline: true,
      },
      {
        name: "Beğen / Beğenme",
        value: `👍 ${data.thumbs_up} | 👎 ${data.thumbs_down}`,
        inline: true,
      },
      {
        name: "Example",
        value: data.example,
        inline: false,
      }
    )
    .setFooter({ text: `Oluşturulmuş ${moment(data.written_on).fromNow()}` });

  return { embeds: [embed] };
}
