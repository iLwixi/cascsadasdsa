const { getSettings } = require("@schemas/Guild");
const { findSuggestion, deleteSuggestionDb } = require("@schemas/Suggestions");
const { SUGGESTIONS } = require("@root/config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  EmbedBuilder,
  ButtonStyle,
  TextInputStyle,
} = require("discord.js");
const { stripIndents } = require("common-tags");

/**
 * @param {import('discord.js').Message} message
 */
const getStats = (message) => {
  const upVotes = (message.reactions.resolve(SUGGESTIONS.EMOJI.UP_VOTE)?.count || 0) - 1;
  const downVotes = (message.reactions.resolve(SUGGESTIONS.EMOJI.DOWN_VOTE)?.count || 0) - 1;
  return [upVotes, downVotes];
};

/**
 * @param {number} upVotes
 * @param {number} downVotes
 */
const getVotesMessage = (upVotes, downVotes) => {
  const total = upVotes + downVotes;
  if (total === 0) {
    return stripIndents`
  _Upvotes: NA_
  _Downvotes: NA_
  `;
  } else {
    return stripIndents`
  _Upvotes: ${upVotes} [${Math.round((upVotes / (upVotes + downVotes)) * 100)}%]_
  _Downvotes: ${downVotes} [${Math.round((downVotes / (upVotes + downVotes)) * 100)}%]_
  `;
  }
};

const hasPerms = (member, settings) => {
  return (
    member.permissions.has("ManageGuild") ||
    member.roles.cache.find((r) => settings.suggestions.staff_roles.includes(r.id))
  );
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function approveSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validate permissions
  if (!hasPerms(member, settings)) return "Önerileri onaylama izniniz yok!";

  // validate if document exists
  const doc = await findSuggestion(guild.id, messageId);
  if (!doc) return "Öneri bulunamadı";
  if (doc.status === "APPROVED") return "Öneri zaten onaylanmış";

  /**
   * @type {import('discord.js').Message}
   */
  let message;
  try {
    message = await channel.messages.fetch({ message: messageId, force: true });
  } catch (err) {
    return "Öneri mesajı bulunamadı";
  }

  let buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("SUGGEST_APPROVE")
      .setLabel("Onayla")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder().setCustomId("SUGGEST_REJECT").setLabel("Reddet").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("SUGGEST_DELETE").setLabel("Sil").setStyle(ButtonStyle.Secondary)
  );

  const approvedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description)
    .setColor(SUGGESTIONS.APPROVED_EMBED)
    .setAuthor({ name: "Öneri onaylandı" })
    .setFooter({ text: ` Tarafından ${member.user.tag}`, iconURL: member.displayAvatarURL() })
    .setTimestamp();

  const fields = [];

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find((field) => field.name === "Stats");
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message);
    doc.stats.upvotes = upVotes;
    doc.stats.downvotes = downVotes;
    fields.push({ name: "Stats", value: getVotesMessage(upVotes, downVotes) });
  } else {
    fields.push(statsField);
  }

  // update reason
  if (reason) fields.push({ name: "Reason", value: "```" + reason + "```" });

  approvedEmbed.addFields(fields);

  try {
    doc.status = "APPROVED";
    doc.status_updates.push({ user_id: member.id, status: "APPROVED", reason, timestamp: new Date() });

    let approveChannel;
    if (settings.suggestions.approved_channel) {
      approveChannel = guild.channels.cache.get(settings.suggestions.approved_channel);
    }

    // suggestions-approve channel is not configured
    if (!approveChannel) {
      await message.edit({ embeds: [approvedEmbed], components: [buttonsRow] });
      await message.reactions.removeAll();
    }

    // suggestions-approve channel is configured
    else {
      const sent = await approveChannel.send({ embeds: [approvedEmbed], components: [buttonsRow] });
      doc.channel_id = approveChannel.id;
      doc.message_id = sent.id;
      await message.delete();
    }

    await doc.save();
    return "Öneri onaylandı";
  } catch (ex) {
    guild.client.logger.error("approveSuggestion", ex);
    return "Öneri onaylayamadı";
  }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function rejectSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validate permissions
  if (!hasPerms(member, settings)) return "Önerileri reddetme izniniz yok!";

  // validate if document exists
  const doc = await findSuggestion(guild.id, messageId);
  if (!doc) return "Öneri bulunamadı";
  if (doc.is_rejected) return "Öneri zaten reddedildi";

  let message;
  try {
    message = await channel.messages.fetch({ message: messageId });
  } catch (err) {
    return "Suggestion message not found";
  }

  let buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("SUGGEST_APPROVE").setLabel("Onayla").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("SUGGEST_REJECT").setLabel("Reddet").setStyle(ButtonStyle.Danger).setDisabled(true),
    new ButtonBuilder().setCustomId("SUGGEST_DELETE").setLabel("Sil").setStyle(ButtonStyle.Secondary)
  );

  const rejectedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description)
    .setColor(SUGGESTIONS.DENIED_EMBED)
    .setAuthor({ name: "Öneri reddedildi" })
    .setFooter({ text: `Hey  önerin reddedildi ${member.user.tag}`, iconURL: member.displayAvatarURL() })
    .setTimestamp();

  const fields = [];

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find((field) => field.name === "Stats");
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message);
    doc.stats.upvotes = upVotes;
    doc.stats.downvotes = downVotes;
    fields.push({ name: "Stats", value: getVotesMessage(upVotes, downVotes) });
  } else {
    fields.push(statsField);
  }

  // update reason
  if (reason) fields.push({ name: "Reason", value: "```" + reason + "```" });

  rejectedEmbed.addFields(fields);

  try {
    doc.status = "REJECTED";
    doc.status_updates.push({ user_id: member.id, status: "REJECTED", reason, timestamp: new Date() });

    let rejectChannel;
    if (settings.suggestions.rejected_channel) {
      rejectChannel = guild.channels.cache.get(settings.suggestions.rejected_channel);
    }

    // suggestions-reject channel is not configured
    if (!rejectChannel) {
      await message.edit({ embeds: [rejectedEmbed], components: [buttonsRow] });
      await message.reactions.removeAll();
    }

    // suggestions-reject channel is configured
    else {
      const sent = await rejectChannel.send({ embeds: [rejectedEmbed], components: [buttonsRow] });
      doc.channel_id = rejectChannel.id;
      doc.message_id = sent.id;
      await message.delete();
    }

    await doc.save();
    return "Öneri reddedildi";
  } catch (ex) {
    guild.client.logger.error("Reddetme", ex);
    return "Öneri reddedilemedi";
  }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function deleteSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validate permissions
  if (!hasPerms(member, settings)) return "Önerileri silme izniniz yok!";

  try {
    await channel.messages.delete(messageId);
    await deleteSuggestionDb(guild.id, messageId, member.id, reason);
    return "Öneri silindi";
  } catch (ex) {
    guild.client.logger.error("deleteSuggestion", ex);
    return "Öneriyi silemedi!Lütfen manuel olarak silin";
  }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleApproveBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Öneri onaylayın",
      customId: "SUGGEST_APPROVE_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleApproveModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await approveSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleRejectBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Reddet Önerisi",
      customId: "SUGGEST_REJECT_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleRejectModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await rejectSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDeleteBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Öneri Sil",
      customId: "SUGGEST_DELETE_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleDeleteModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await deleteSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp({ content: response, ephemeral: true });
}

module.exports = {
  handleApproveBtn,
  handleApproveModal,
  handleRejectBtn,
  handleRejectModal,
  handleDeleteBtn,
  handleDeleteModal,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
};
