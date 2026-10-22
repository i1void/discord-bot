import db from "./db.js";
import { COLORS } from "./embed.js";
import { buildMessage } from "./template.js";

export const DEFAULTS = {
  greet: "%user.mention% has joined the server!",
  greetdm: "Welcome to the server %user.name%",
  bye: "%user.name% has left the server!",
  boost: "%user.mention% has boosted the server!",
};

const hydrate = (row, guildId, type) => ({
  guild_id: guildId,
  type,
  message_text: row?.message_text ?? DEFAULTS[type],
  is_enabled: !!row?.is_enabled,
  channel_id: row?.channel_id ?? null,
  auto_delete: row?.auto_delete ?? 30,
});

/** Saved settings, or null if this type was never configured. */
export function getGreet(guildId, type) {
  const row = db.prepare("SELECT * FROM greet_settings WHERE guild_id = ? AND type = ?").get(guildId, type);
  return row ? hydrate(row, guildId, type) : null;
}

/** Saved settings, or the defaults (used by the test commands). */
export const getGreetOrDefault = (guildId, type) =>
  getGreet(guildId, type) ?? hydrate(null, guildId, type);

/** Flips a type on/off. Turning on also binds it to channelId. Returns the new state. */
export function toggleGreet(guildId, type, channelId) {
  const enabled = !getGreet(guildId, type)?.is_enabled;
  db.prepare(
    "INSERT INTO greet_settings (guild_id, type, is_enabled, channel_id) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(guild_id, type) DO UPDATE SET is_enabled = excluded.is_enabled, " +
      "channel_id = COALESCE(excluded.channel_id, channel_id)"
  ).run(guildId, type, enabled ? 1 : 0, enabled ? channelId : null);
  return enabled;
}

export function disableGreet(guildId, type) {
  db.prepare("UPDATE greet_settings SET is_enabled = 0 WHERE guild_id = ? AND type = ?").run(guildId, type);
}

/** Saves the message. Returns whether this type is currently enabled. */
export function setGreetMessage(guildId, type, text) {
  db.prepare(
    "INSERT INTO greet_settings (guild_id, type, message_text) VALUES (?, ?, ?) " +
      "ON CONFLICT(guild_id, type) DO UPDATE SET message_text = excluded.message_text"
  ).run(guildId, type, text);
  return !!getGreet(guildId, type)?.is_enabled;
}

export function setGreetDelete(guildId, type, seconds) {
  db.prepare(
    "INSERT INTO greet_settings (guild_id, type, auto_delete) VALUES (?, ?, ?) " +
      "ON CONFLICT(guild_id, type) DO UPDATE SET auto_delete = excluded.auto_delete"
  ).run(guildId, type, seconds);
}

export function clearGuildGreets(guildId) {
  db.prepare("DELETE FROM greet_settings WHERE guild_id = ?").run(guildId);
}

/**
 * Builds and sends one greet/bye/boost message. Throws on Discord errors.
 * For greetdm the message goes to the user's DMs with a "sent from <server>" footer.
 */
export async function sendGreet(conf, { client, guild, user, member, channel }) {
  const isDm = conf.type === "greetdm";
  let payload = buildMessage(conf.message_text, { client, guild, channel: isDm ? null : channel, user, member });

  if (isDm) {
    const footer = { text: `This message was sent from ${guild.name} server.`, icon_url: guild.iconURL() ?? undefined };

    if (!payload.embeds.length) {
      payload = { embeds: [{ color: COLORS.ok, description: payload.content, footer }] };
    } else if (payload.embeds.length >= 10) {
      payload.embeds[9] = { ...payload.embeds[9], footer };
    } else {
      payload.embeds.push({ footer });
    }
    return user.send({ ...payload, allowedMentions: { parse: [] } });
  }

  // Only user mentions can ping from a greet message; @everyone/@here/roles never do.
  const sent = await channel.send({ ...payload, allowedMentions: { parse: ["users"] } });
  if (conf.auto_delete > 0) setTimeout(() => sent.delete().catch(() => {}), conf.auto_delete * 1000);
  return sent;
}

// Greets go through a small queue (like Nadeko's) so a raid can't flood the channel or hit rate limits.
const queue = [];
let timer = null;

async function tick() {
  const batch = queue.splice(0, 5);
  if (!batch.length) {
    clearInterval(timer);
    timer = null;
    return;
  }
  await Promise.all(batch.map(job => job()));
}

export function enqueue(job) {
  if (queue.length >= 100) return; // drop extras during a huge raid
  queue.push(job);
  if (!timer) {
    timer = setInterval(tick, 2_000);
    tick();
  }
}

/** Sends for real (from an event). Disables the type if the channel is gone or we lost permission. */
export async function deliver(conf, vars) {
  try {
    await sendGreet(conf, vars);
  } catch (err) {
    if (conf.type === "greetdm") return; // closed DMs are normal

    if ([50013, 50001, 10003].includes(err.code)) {
      console.warn(`[greet] disabling "${conf.type}" in ${conf.guild_id}: ${err.message}`);
      disableGreet(conf.guild_id, conf.type);
    } else {
      console.error(`[greet ${conf.type}]`, err);
    }
  }
}
