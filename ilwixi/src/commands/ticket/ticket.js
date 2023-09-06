const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
  ComponentType,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { isTicketChannel, closeTicket, closeAllTickets } = require("@handlers/ticket");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ticket",
  description: "Çeşitli bilet komutları",
  category: "TICKET",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "setup <#channel>",
        description: "Etkileşimli bir bilet kurulumu başlatın",
      },
      {
        trigger: "log <#channel>",
        description: "Biletler için Günlük Kanalı Kurulum",
      },
      {
        trigger: "limit <number>",
        description: "Maksimum eşzamanlı açık bilet sayısı ayarlayın",
      },
      {
        trigger: "close",
        description: "bileti kapat",
      },
      {
        trigger: "closeall",
        description: "Tüm açık biletleri kapatın",
      },
      {
        trigger: "add <userId|roleId>",
        description: "bilete kullanıcı/rol ekleyin",
      },
      {
        trigger: "remove <userId|roleId>",
        description: "biletten kullanıcı/rolü kaldırın",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "setup",
        description: "Yeni bir bilet mesajı ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Bilet oluşturma mesajının gönderilmesi gereken kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "log",
        description: "Biletler için Günlük Kanalı Kurulum",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Bilet günlüklerinin gönderilmesi gereken kanal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "limit",
        description: "Maksimum eşzamanlı açık bilet sayısı ayarlayın",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "maksimum bilet sayısı",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "close",
        description: "bileti kapatır [Yalnızca bilet kanalında kullanılır]",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "closeall",
        description: "Tüm açık biletleri kapatır",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "add",
        description: "Mevcut bilet kanalına kullanıcı ekleyin [yalnızca bilet kanalında kullanılır]",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user_id",
            description: "the id of the user to add",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Kullanıcıyı bilet kanalından kaldır [yalnızca bilet kanalında kullanılır]",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "kullanıcı kaldırılacak",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    let response;

    // Setup
    if (input === "setup") {
      if (!message.guild.members.me.permissions.has("ManageChannels")) {
        return message.safeReply("Bilet kanalları oluşturmak için `` kanalları yönet '' yi kaçırıyorum");
      }
      const targetChannel = message.guild.findMatchingChannels(args[1])[0];
      if (!targetChannel) {
        return message.safeReply("Bu isimle kanal bulamadım");
      }
      return ticketModalSetup(message, targetChannel, data.settings);
    }

    // log ticket
    else if (input === "log") {
      if (args.length < 2) return message.safeReply("Lütfen bilet günlüklerinin gönderilmesi gereken bir kanal sağlayın");
      const target = message.guild.findMatchingChannels(args[1]);
      if (target.length === 0) return message.safeReply("Eşleşen herhangi bir kanal bulamadı");
      response = await setupLogChannel(target[0], data.settings);
    }

    // Set limit
    else if (input === "limit") {
      if (args.length < 2) return message.safeReply("Lütfen bir numara sağlayın");
      const limit = args[1];
      if (isNaN(limit)) return message.safeReply("Lütfen bir sayı girişi sağlayın");
      response = await setupLimit(limit, data.settings);
    }

    // Close ticket
    else if (input === "close") {
      response = await close(message, message.author);
      if (!response) return;
    }

    // Close all tickets
    else if (input === "closeall") {
      let sent = await message.safeReply("Kapanış biletleri ...");
      response = await closeAll(message, message.author);
      return sent.editable ? sent.edit(response) : message.channel.send(response);
    }

    // Add user to ticket
    else if (input === "add") {
      if (args.length < 2) return message.safeReply("Lütfen bilete eklemek için bir kullanıcı veya rol verin");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await addToTicket(message, inputId);
    }

    // Remove user from ticket
    else if (input === "remove") {
      if (args.length < 2) return message.safeReply("Lütfen kaldıracak bir kullanıcı veya rol verin");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await removeFromTicket(message, inputId);
    }

    // Invalid input
    else {
      return message.safeReply("Yanlış Komut Kullanımı");
    }

    if (response) await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // setup
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");

      if (!interaction.guild.members.me.permissions.has("ManageChannels")) {
        return interaction.followUp("Bilet kanalları oluşturmak için `kanalları yönet` yi kaçırıyorum");
      }

      await interaction.deleteReply();
      return ticketModalSetup(interaction, channel, data.settings);
    }

    // Log channel
    else if (sub === "log") {
      const channel = interaction.options.getChannel("channel");
      response = await setupLogChannel(channel, data.settings);
    }

    // Limit
    else if (sub === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setupLimit(limit, data.settings);
    }

    // Close
    else if (sub === "close") {
      response = await close(interaction, interaction.user);
    }

    // Close all
    else if (sub === "closeall") {
      response = await closeAll(interaction, interaction.user);
    }

    // Add to ticket
    else if (sub === "add") {
      const inputId = interaction.options.getString("user_id");
      response = await addToTicket(interaction, inputId);
    }

    // Remove from ticket
    else if (sub === "remove") {
      const user = interaction.options.getUser("user");
      response = await removeFromTicket(interaction, user.id);
    }

    if (response) await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').Message} param0
 * @param {import('discord.js').GuildTextBasedChannel} targetChannel
 * @param {object} settings
 */
async function ticketModalSetup({ guild, channel, member }, targetChannel, settings) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_btnSetup").setLabel("Destek Sistemi Eklemek İçin Tıklayın!").setStyle(ButtonStyle.Primary)
  );

  const sentMsg = await channel.safeSend({
    content: "Bilet mesajını ayarlamak için lütfen aşağıdaki düğmeyi tıklayın",
    components: [buttonRow],
  });

  if (!sentMsg) return;

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "ticket_btnSetup" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => { });

  if (!btnInteraction) return sentMsg.edit({ content: "Yanıt alınmadı, Kurulumu İptal Etme", components: [] });

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "ticket-modalSetup",
      title: "Bilet kurulumu",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Emme başlığı")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Gömme Açıklama")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Alt altbilgi")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("staff")
            .setLabel("Personel Rolleri")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );

  // receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: (m) => m.customId === "ticket-modalSetup" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => { });

  if (!modal) return sentMsg.edit({ content: "Yanıt alınmadı, Kurulumu İptal Etme", components: [] });

  await modal.reply("Bilet mesajı ayarlayın ...");
  const title = modal.fields.getTextInputValue("title");
  const description = modal.fields.getTextInputValue("description");
  const footer = modal.fields.getTextInputValue("footer");
  const staffRoles = modal.fields
    .getTextInputValue("staff")
    .split(",")
    .filter((s) => guild.roles.cache.has(s.trim()));

  // send ticket message
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: title || "Destek bileti" })
    .setDescription(description || "Bilet oluşturmak için lütfen aşağıdaki düğmeyi kullanın")
    .setFooter({ text: footer || "Bir seferde sadece 1 açık bilet alabilirsiniz!" });

  const tktBtnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Bilet aç").setCustomId("TICKET_CREATE").setStyle(ButtonStyle.Success)
  );

  // save configuration
  settings.ticket.staff_roles = staffRoles;
  await settings.save();

  await targetChannel.send({ embeds: [embed], components: [tktBtnRow] });
  await modal.deleteReply();
  await sentMsg.edit({ content: "Tamamlamak!Bilet Mesajı Oluşturuldu", components: [] });
}

async function setupLogChannel(target, settings) {
  if (!target.canSendEmbeds()) return `Oops!Gömme gönderme iznim var ${target}`;

  settings.ticket.log_channel = target.id;
  await settings.save();

  return `Yapılandırma kaydedildi!Bilet günlükleri gönderilecek ${target.toString()}`;
}

async function setupLimit(limit, settings) {
  if (Number.parseInt(limit, 10) < 5) return "Bilet sınırı 5'ten az olamaz";

  settings.ticket.limit = limit;
  await settings.save();

  return `Yapılandırma kaydedildi.Artık en fazla sahip olabilirsiniz \`${limit}\` açık biletler`;
}

async function close({ channel }, author) {
  if (!isTicketChannel(channel)) return "Bu komut yalnızca bilet kanallarında kullanılabilir";
  const status = await closeTicket(channel, author, "Bir moderatör tarafından kapalı");
  if (status === "MISSING_PERMISSIONS") return "Biletleri kapatma iznim yok";
  if (status === "ERROR") return "Bileti kapatırken bir hata oluştu";
  return null;
}

async function closeAll({ guild }, user) {
  const stats = await closeAllTickets(guild, user);
  return `Tamamlanmış!Başarı: \`${stats[0]}\` Failed: \`${stats[1]}\``;
}

async function addToTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Bu komut yalnızca bilet kanalında kullanılabilir";
  if (!inputId || isNaN(inputId)) return "Oops!Geçerli bir kullanıcı kimliği/roleID girmeniz gerekiyor";

  try {
    await channel.permissionOverwrites.create(inputId, {
      ViewChannel: true,
      SendMessages: true,
    });

    return "Done";
  } catch (ex) {
    return "Kullanıcı/rol ekleyemedi.Geçerli bir kimlik sağladınız mı?";
  }
}

async function removeFromTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Bu komut yalnızca bilet kanalında kullanılabilir";
  if (!inputId || isNaN(inputId)) return "Oops!Geçerli bir kullanıcı kimliği/roleID girmeniz gerekiyor";

  try {
    channel.permissionOverwrites.create(inputId, {
      ViewChannel: false,
      SendMessages: false,
    });
    return "Tamamlamak";
  } catch (ex) {
    return "Kullanıcı/rolü kaldıramadı.Geçerli bir kimlik sağladınız mı?";
  }
}
