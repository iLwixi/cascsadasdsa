const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");
const { stripIndent } = require("common-tags");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "github",
  description: "Bir kullanıcının GitHub istatistiklerini gösterir",
  cooldown: 10,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["git"],
    usage: "<username>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "username",
        description: "Github kullanıcı adı",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const username = args.join(" ");
    const response = await getGithubUser(username, message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const username = interaction.options.getString("username");
    const response = await getGithubUser(username, interaction.user);
    await interaction.followUp(response);
  },
};

const websiteProvided = (text) => (text.startsWith("http://") ? true : text.startsWith("https://"));

async function getGithubUser(target, author) {
  const response = await getJson(`https://api.github.com/users/${target}`);
  if (response.status === 404) return "```Bu isimle hiçbir kullanıcı bulunamadı```";
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  const {
    login: username,
    name,
    id: githubId,
    avatar_url: avatarUrl,
    html_url: userPageLink,
    followers,
    following,
    bio,
    location,
    blog,
  } = json;

  let website = websiteProvided(blog) ? `[Bana Tıkla](${blog})` : "Sağlanmadı";
  if (website == null) website = "Sağlanmadı";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Github kullanıcısı: ${username}`,
      url: userPageLink,
      iconURL: avatarUrl,
    })
    .addFields(
      {
        name: "Kullanıcı bilgisi",
        value: stripIndent`
        **Gerçek ad**: *${name || "Sağlanmadı"}*
        **Konum**: *${location}*
        **Github Kimliği**: *${githubId}*
        **Website**: *${website}*\n`,
        inline: true,
      },
      {
        name: "Sosyal İstatistikler",
        value: `**Takipçiler**: *${followers}*\n**Takip etme**: *${following}*`,
        inline: true,
      }
    )
    .setDescription(`**Bio**:\n${bio || "Sağlanmadı"}`)
    .setImage(avatarUrl)
    .setColor(0x6e5494)
    .setFooter({ text: `Tarafından talep edildi ${author.tag}` });

  return { embeds: [embed] };
}
