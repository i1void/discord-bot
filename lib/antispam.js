import db from "./db.js";

/** A repeat only counts if it comes within this many ms of the previous one. */
export const MAX_GAP = 30_000;
export const ACTIONS = ["warn", "mute", "kick", "ban"]; // mute = Discord timeout (no Muted role needed)

const configs = new Map(); // guildId -> { message_count, action, duration } | null
const ignored = new Map(); // guildId -> Set(channelId)
const recent = new Map(); // "guildId:userId" -> { text, list: [{ id, channelId, at }] }

/** The guild's anti-spam settings, or null if it's off. */
export function getConfig(guildId) {
  if (!configs.has(guildId)) {
    const row = db
      .prepare("SELECT message_count, action, duration FROM antispam WHERE guild_id = ?")
      .get(guildId);
    configs.set(guildId, row ?? null);
  }
  return configs.get(guildId);
}

export function setConfig(guildId, messageCount, action, duration) {
  db.prepare(
    "INSERT INTO antispam (guild_id, message_count, action, duration) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(guild_id) DO UPDATE SET message_count = excluded.message_count, " +
      "action = excluded.action, duration = excluded.duration"
  ).run(guildId, messageCount, action, duration);
  configs.set(guildId, { message_count: messageCount, action, duration });
}

export function disableConfig(guildId) {
  db.prepare("DELETE FROM antispam WHERE guild_id = ?").run(guildId);
  configs.set(guildId, null);
}

function ignoredSet(guildId) {
  if (!ignored.has(guildId)) {
    const rows = db.prepare("SELECT channel_id FROM antispam_ignored WHERE guild_id = ?").all(guildId);
    ignored.set(guildId, new Set(rows.map(r => r.channel_id)));
  }
  return ignored.get(guildId);
}

export const isIgnored = (guildId, channelId) => ignoredSet(guildId).has(channelId);

/** IDs of the channels anti-spam skips in this guild. */
export const getIgnored = guildId => [...ignoredSet(guildId)];

/** Flips whether anti-spam skips a channel. Returns the new state (true = ignored). */
export function toggleIgnored(guildId, channelId) {
  const set = ignoredSet(guildId);

  if (set.has(channelId)) {
    db.prepare("DELETE FROM antispam_ignored WHERE guild_id = ? AND channel_id = ?").run(guildId, channelId);
    set.delete(channelId);
    return false;
  }

  db.prepare("INSERT OR IGNORE INTO antispam_ignored (guild_id, channel_id) VALUES (?, ?)").run(guildId, channelId);
  set.add(channelId);
  return true;
}

/** Forget everything about a guild (the bot was removed from it). */
export function clearGuild(guildId) {
  db.prepare("DELETE FROM antispam WHERE guild_id = ?").run(guildId);
  db.prepare("DELETE FROM antispam_ignored WHERE guild_id = ?").run(guildId);
  configs.delete(guildId);
  ignored.delete(guildId);
}

/**
 * Remembers one message. Once the member has sent the same text `limit` times in a row,
 * returns those messages (and resets their counter); otherwise returns null.
 */
export function record(guildId, userId, text, entry, limit) {
  const key = `${guildId}:${userId}`;
  const prev = recent.get(key);

  const repeat = prev && prev.text === text && entry.at - prev.list.at(-1).at < MAX_GAP;
  const list = repeat ? [...prev.list, entry] : [entry];

  if (list.length >= limit) {
    recent.delete(key);
    return list;
  }
  recent.set(key, { text, list });
  return null;
}

// Drop counters of people who stopped talking, so the map can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, { list }] of recent) {
    if (now - list.at(-1).at > MAX_GAP) recent.delete(key);
  }
}, 60_000).unref();
