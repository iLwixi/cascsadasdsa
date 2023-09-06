const { ApplicationCommandOptionType } = require("discord.js");
const balance = require("./sub/balance");
const deposit = require("./sub/deposit");
const transfer = require("./sub/transfer");
const withdraw = require("./sub/withdraw");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "banka",
  description: "Banka operasyonlarına erişimşim",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "denge",
        description: "Bakiyenizi kontrol edin",
      },
      {
        trigger: "deposit <coins>",
        description: "Banka hesabınıza para yatırın",
      },
      {
        trigger: "withdraw <coins>",
        description: "Paraları banka hesabınızdan çekin",
      },
      {
        trigger: "transfer <user> <coins>",
        description: "Paraları başka bir kullanıcıya aktarın",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "balance",
        description: "Para bakiyenizi kontrol edin",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "kullanıcının adı",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: "deposit",
        description: "Banka hesabınıza para yatırın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "Para yatırılacak madeni para sayısı",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "withdraw",
        description: "Paraları banka hesabınızdan çekin",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "Çekilecek para sayısı",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "transfer",
        description: "Paraları diğer kullanıcıya aktarın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "madeni para aktarılması gereken kullanıcı",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "coins",
            description: "transfer edilecek madeni para miktarı",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0];
    let response;

    if (sub === "balance") {
      const resolved = (await message.guild.resolveMember(args[1])) || message.member;
      response = await balance(resolved.user);
    }

    //
    else if (sub === "deposit") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Yatırmak istediğiniz geçerli sayıda parayı sağlayın");
      response = await deposit(message.author, coins);
    }

    //
    else if (sub === "withdraw") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Çekmek istediğiniz geçerli sayıda para sağlayın");
      response = await withdraw(message.author, coins);
    }

    //
    else if (sub === "transfer") {
      if (args.length < 3) return message.safeReply("Aktarmak için geçerli bir kullanıcı ve madeni para sağlayın");
      const target = await message.guild.resolveMember(args[1], true);
      if (!target) return message.safeReply("Paraları aktarmak için geçerli bir kullanıcı sağlayın");
      const coins = parseInt(args[2]);
      if (isNaN(coins)) return message.safeReply("Aktarmak istediğiniz geçerli sayıda para sağlayın");
      response = await transfer(message.author, target.user, coins);
    }

    //
    else {
      return message.safeReply("Geçersiz Komut Kullanımı");
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // balance
    if (sub === "balance") {
      const user = interaction.options.getUser("user") || interaction.user;
      response = await balance(user);
    }

    // deposit
    else if (sub === "deposit") {
      const coins = interaction.options.getInteger("coins");
      response = await deposit(interaction.user, coins);
    }

    // withdraw
    else if (sub === "withdraw") {
      const coins = interaction.options.getInteger("coins");
      response = await withdraw(interaction.user, coins);
    }

    // transfer
    else if (sub === "transfer") {
      const user = interaction.options.getUser("user");
      const coins = interaction.options.getInteger("coins");
      response = await transfer(interaction.user, user, coins);
    }

    await interaction.followUp(response);
  },
};
