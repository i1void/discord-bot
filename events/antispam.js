import { Events, PermissionFlagsBits } from "discord.js";
import { clearGuild, getConfig, isIgnored, record } from "../lib/antispam.js";
import db from "../lib/db.js";
import { pending } from "../lib/embed.js";
import { formatDuration } from "../lib/parse.js";

const REASON = "Anti-spam";

/** Deletes the messages that triggered the punishment (best effort). */
async function deleteSpam(guild, entries) {
  const byChannel = new Map();
  for (const { id, channelId } of entries) {
    if (!byChannel.has(channelId)) byChannel.set(channelId, []);
    byChannel.get(channelId).push(id);
  }

  for (const [channelId, ids] of byChannel) {
    await guild.channels.cache.get(channelId)?.bulkDelete(ids, true).catch(() => {});
  }
}

/** Runs the configured action. Returns the text to announce, or null if nothing could be done. */
async function applyAction({ guild, member, author, client }, conf) {
  switch (conf.action) {
    case "warn": {
      db.prepare(
        "INSERT INTO warns (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(guild.id, author.id, client.user.id, "Spamming (anti-spam)", Date.now());

      const { total } = db
        .prepare("SELECT COUNT(*) AS total FROM warns WHERE guild_id = ? AND user_id = ?")
        .get(guild.id, author.id);
      return `**${author.tag}** was warned for spamming (${total} total).`;
    }

    case "mute":
    case "timeout": // older saved settings.
      if (!member.moderatable) return null;
      await member.timeout(conf.duration, REASON);
      return `**${author.tag}** was muted for **${formatDuration(conf.duration)}** for spamming.`;

    case "kick":
      if (!member.kickable) return null;
      await member.kick(REASON);
      return `**${author.tag}** was kicked for spamming.`;

    case "ban":
      if (!member.bannable) return null;
      await guild.members.ban(author, { reason: REASON });
      return `**${author.tag}** was banned for spamming.`;
  }
  return null;
}

export default [
  {
    name: Events.MessageCreate,

    async run(client, message) {
      if (!message.guild || message.author.bot || !message.member) return;

      const conf = getConfig(message.guildId);
      if (!conf || isIgnored(message.guildId, message.channelId)) return;

      // Moderators (and admins/owner, who have every permission) are never punished.
      if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

      // Only text counts (an image with no caption can't be compared); case and spacing don't matter.
      const content = message.content.trim().toLowerCase();
      if (!content) return;

      const entry = { id: message.id, channelId: message.channelId, at: message.createdTimestamp };
      const spam = record(message.guildId, message.author.id, content, entry, conf.message_count);
      if (!spam) return;

      await deleteSpam(message.guild, spam);

      const text = await applyAction(message, conf);
      if (!text) return;

      const sent = await message.channel.send({ embeds: [pending(text)] }).catch(() => null);
      if (sent) setTimeout(() => sent.delete().catch(() => {}), 10_000);
    },
  },

  {
    // Bot was removed from a server: forget its anti-spam settings (ignore temporary outages).
    name: Events.GuildDelete,
    run(client, guild) {
      if (guild.available === false) return;
      clearGuild(guild.id);
    },
  },
];
