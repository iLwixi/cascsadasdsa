const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (self, target, coins) => {
  if (isNaN(coins) || coins <= 0) return "Lütfen aktarmak için geçerli miktarda madeni para girin";
  if (target.bot) return "Paraları botlara aktaramazsınız!";
  if (target.id === self.id) return "Paraları kendine aktaramazsın!";

  const userDb = await getUser(self);

  if (userDb.bank < coins) {
    return `Yetersiz banka bakiyesi! Banka hesabında sadece  ${userDb.bank}${ECONOMY.CURRENCY} para var.${
      userDb.coins > 0 && "\nTransfer yapmadan önce madeni paralarınızı bankada yatırmalısınız"
    } `;
  }

  const targetDb = await getUser(target);

  userDb.bank -= coins;
  targetDb.bank += coins;

  await userDb.save();
  await targetDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Paran Güncellendi" })
    .setDescription(`Başarıyla FAST ANLIK GÖNDERİM uygulandı ${coins}${ECONOMY.CURRENCY} şu kullanıcıya ${target.tag}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
