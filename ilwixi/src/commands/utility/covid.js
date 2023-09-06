const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");
const timestampToDate = require("timestamp-to-date");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "covid",
  description: "Bir ülke için Covid istatistikleri alın",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<country>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "country",
        description: "covid istatistikleri almak için ülke adı",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const country = args.join(" ");
    const response = await getCovid(country);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const country = interaction.options.getString("country");
    const response = await getCovid(country);
    await interaction.followUp(response);
  },
};

async function getCovid(country) {
  const response = await getJson(`https://disease.sh/v2/countries/${country}`);

  if (response.status === 404) return "```css\nVerilen isme sahip ülke bulunamadı```";
  if (!response.success) return MESSAGES.API_ERROR;
  const { data } = response;

  const mg = timestampToDate(data?.updated, "dd.MM.yyyy at HH:mm");
  const embed = new EmbedBuilder()
    .setTitle(`Covid - ${data?.country}`)
    .setThumbnail(data?.countryInfo.flag)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addFields(
      {
        name: "Toplam davalar",
        value: data?.cases.toString(),
        inline: true,
      },
      {
        name: "Bugün vakalar",
        value: data?.todayCases.toString(),
        inline: true,
      },
      {
        name: "Ölüm Toplamı",
        value: data?.deaths.toString(),
        inline: true,
      },
      {
        name: "Bugün Ölümler",
        value: data?.todayDeaths.toString(),
        inline: true,
      },
      {
        name: "Kurtarılmış",
        value: data?.recovered.toString(),
        inline: true,
      },
      {
        name: "Aktif",
        value: data?.active.toString(),
        inline: true,
      },
      {
        name: "Eleştirel",
        value: data?.critical.toString(),
        inline: true,
      },
      {
        name: "1 milyon başına dava",
        value: data?.casesPerOneMillion.toString(),
        inline: true,
      },
      {
        name: "1 milyon başına ölüm",
        value: data?.deathsPerOneMillion.toString(),
        inline: true,
      }
    )
    .setFooter({ text: `Son güncellendi ${mg}` });

  return { embeds: [embed] };
}
