import db from "./db.js";

const cache = new Map();

export const defaultPrefix = () => process.env.PREFIX || ".";

export function getPrefix(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);

  const row = db.prepare("SELECT prefix FROM guild_settings WHERE guild_id = ?").get(guildId);
  const prefix = row?.prefix ?? defaultPrefix();
  cache.set(guildId, prefix);
  return prefix;
}

export function setPrefix(guildId, prefix) {
  db.prepare(
    "INSERT INTO guild_settings (guild_id, prefix) VALUES (?, ?) " +
      "ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix"
  ).run(guildId, prefix);
  cache.set(guildId, prefix);
}

// Channels where AI mode is on (the bot answers every message, no prefix needed).
let aiChannels;
const loadAi = () =>
  (aiChannels ??= new Set(db.prepare("SELECT channel_id FROM ai_channels").all().map(r => r.channel_id)));

export const isAiChannel = channelId => loadAi().has(channelId);

/** Flips AI mode for a channel. Returns the new state (true = on). */
export function toggleAiChannel(guildId, channelId) {
  const set = loadAi();

  if (set.has(channelId)) {
    db.prepare("DELETE FROM ai_channels WHERE channel_id = ?").run(channelId);
    set.delete(channelId);
    return false;
  }

  db.prepare("INSERT OR IGNORE INTO ai_channels (channel_id, guild_id) VALUES (?, ?)").run(channelId, guildId);
  set.add(channelId);
  return true;
}
