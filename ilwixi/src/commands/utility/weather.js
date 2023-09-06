const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");

const API_KEY = process.env.WEATHERSTACK_KEY;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "havad",
  description: "Hava Durumu Bilgileri Alın",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<place>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "place",
        description: "Hava durumu bilgisi almak için ülke/şehir adı",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const place = args.join(" ");
    const response = await weather(place);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const place = interaction.options.getString("place");
    const response = await weather(place);
    await interaction.followUp(response);
  },
};

async function weather(place) {
  const response = await getJson(`http://api.weatherstack.com/current?access_key=${API_KEY}&query=${place}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  if (!json.request) return `Hiçbir şehir eşleşti \`${place}\``;

  const embed = new EmbedBuilder()
    .setTitle("Hava Durumu")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.current?.weather_icons[0])
    .addFields(
      { name: "Şehir", value: json.location?.name || "NA", inline: true },
      { name: "Bölge", value: json.location?.region || "NA", inline: true },
      { name: "Ülke", value: json.location?.country || "NA", inline: true },
      { name: "Hava Durumu", value: json.current?.weather_descriptions[0] || "NA", inline: true },
      { name: "Tarih", value: json.location?.localtime.slice(0, 10) || "NA", inline: true },
      { name: "Zaman", value: json.location?.localtime.slice(11, 16) || "NA", inline: true },
      { name: "Sıcaklık", value: `${json.current?.temperature}°C`, inline: true },
      { name: "Bulut örtüsü", value: `${json.current?.cloudcover}%`, inline: true },
      { name: "Rüzgar hızı", value: `${json.current?.wind_speed} km/h`, inline: true },
      { name: "Rüzgar yönü", value: json.current?.wind_dir || "NA", inline: true },
      { name: "Basınç", value: `${json.current?.pressure} mb`, inline: true },
      { name: "Yağış", value: `${json.current?.precip.toString()} mm`, inline: true },
      { name: "Nem", value: json.current?.humidity.toString() || "NA", inline: true },
      { name: "Görsel mesafe", value: `${json.current?.visibility} km`, inline: true },
      { name: "UV Endeksi", value: json.current?.uv_index.toString() || "NA", inline: true }
    )
    .setFooter({ text: `Son kontrol edildi ${json.current?.observation_time} gmt` });

  return { embeds: [embed] };
}
