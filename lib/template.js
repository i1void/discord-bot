/**
 * Message templates, Nadeko style:
 *  - plain text with %placeholders%
 *  - or a JSON object: { "plainText": "...", "title": "...", "description": "...", "color": "4caf8f",
 *      "thumbnail": "url", "image": "url", "author": {...}, "footer": {...}, "fields": [...] }
 *    or { "plainText": "...", "embeds": [ {...}, {...} ] }
 * Placeholders are replaced inside every string value AFTER the JSON is parsed,
 * so a username with quotes can never break the JSON.
 */

const pad = n => String(n).padStart(2, "0");
const fmtDate = d =>
  d ? `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}` : "??.??.????";
const fmtTime = d => (d ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : "??:??");
const safe = text => String(text).replaceAll("@", "@\u200b");

export const PLACEHOLDERS = {
  User: [
    "%user% / %user.mention%",
    "%user.name%",
    "%user.fullname%",
    "%user.displayname%",
    "%user.id%",
    "%user.avatar%",
    "%user.created_date% / %user.created_time%",
    "%user.joined_date% / %user.joined_time%",
  ],
  Server: [
    "%server% / %server.name%",
    "%server.id%",
    "%server.icon%",
    "%server.members%",
    "%server.boosters%",
    "%server.boost_level%",
  ],
  Channel: ["%channel.mention%", "%channel% / %channel.name%", "%channel.id%", "%channel.topic%"],
  Bot: ["%bot.name%", "%bot.mention%", "%bot.id%", "%bot.avatar%"],
  Other: ["%rng% (0-100)", "%rng5-20% (random number in a range)"],
};

function makeReplacer({ client, guild, channel, user, member }) {
  const map = {
    "%bot.name%": client.user.username,
    "%bot.mention%": `<@${client.user.id}>`,
    "%bot.id%": client.user.id,
    "%bot.avatar%": client.user.displayAvatarURL(),

    "%server%": guild.name,
    "%server.name%": guild.name,
    "%server.id%": guild.id,
    "%server.icon%": guild.iconURL() ?? "",
    "%server.members%": guild.memberCount,
    "%server.boosters%": guild.premiumSubscriptionCount ?? 0,
    "%server.boost_level%": guild.premiumTier,

    "%user%": `<@${user.id}>`,
    "%user.mention%": `<@${user.id}>`,
    "%user.name%": safe(user.username),
    "%user.fullname%": safe(user.tag),
    "%user.displayname%": safe(member?.displayName ?? user.globalName ?? user.username),
    "%user.id%": user.id,
    "%user.avatar%": user.displayAvatarURL({ size: 256 }),
    "%user.created_date%": fmtDate(user.createdAt),
    "%user.created_time%": fmtTime(user.createdAt),
    "%user.joined_date%": fmtDate(member?.joinedAt),
    "%user.joined_time%": fmtTime(member?.joinedAt),
  };

  if (channel) {
    Object.assign(map, {
      "%channel%": channel.name,
      "%channel.name%": channel.name,
      "%channel.mention%": `<#${channel.id}>`,
      "%channel.id%": channel.id,
      "%channel.topic%": channel.topic || "-",
    });
  }

  return text =>
    text
      .replace(/%rng(?:(\d+)-(\d+))?%/gi, (_, a, b) => {
        const x = Number(a ?? 0);
        const y = Number(b ?? 100);
        const [lo, hi] = x <= y ? [x, y] : [y, x];
        return String(lo + Math.floor(Math.random() * (hi - lo + 1)));
      })
      .replace(/%[a-z_]+(?:\.[a-z_]+)?%/gi, m => {
        const value = map[m.toLowerCase()];
        return value === undefined ? m : String(value);
      });
}

function tryParseObject(text) {
  const t = text.trim();
  if (!t.startsWith("{")) return null;
  try {
    const value = JSON.parse(t);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

const EMBED_KEYS = ["title", "description", "url", "color", "thumbnail", "image", "author", "footer", "fields"];

function toColor(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^(#|0x)?[0-9a-f]{6}$/i.test(value.trim())) {
    return parseInt(value.trim().replace(/^#|^0x/i, ""), 16);
  }
  return undefined;
}

const toMedia = v => (typeof v === "string" ? { url: v } : v?.url ? { url: v.url } : undefined);

/** Nadeko-style embed JSON -> Discord API embed object. */
function toEmbed(e) {
  const out = {};
  if (e.title) out.title = String(e.title).slice(0, 256);
  if (e.description) out.description = String(e.description).slice(0, 4096);
  if (e.url) out.url = String(e.url);

  const color = toColor(e.color);
  if (color !== undefined) out.color = color;

  const thumbnail = toMedia(e.thumbnail);
  if (thumbnail) out.thumbnail = thumbnail;
  const image = toMedia(e.image);
  if (image) out.image = image;

  if (e.author?.name) {
    out.author = {
      name: String(e.author.name).slice(0, 256),
      url: e.author.url,
      icon_url: e.author.icon_url ?? e.author.iconUrl ?? e.author.icon,
    };
  }
  if (e.footer?.text) {
    out.footer = {
      text: String(e.footer.text).slice(0, 2048),
      icon_url: e.footer.icon_url ?? e.footer.iconUrl ?? e.footer.icon,
    };
  }
  if (Array.isArray(e.fields)) {
    out.fields = e.fields
      .filter(f => f?.name && f?.value)
      .slice(0, 25)
      .map(f => ({ name: String(f.name).slice(0, 256), value: String(f.value).slice(0, 1024), inline: !!f.inline }));
  }
  return out;
}

/** Template + variables -> { content?: string, embeds: APIEmbed[] } */
export function buildMessage(template, vars) {
  const replace = makeReplacer(vars);
  const parsed = tryParseObject(template);

  if (!parsed) return { content: replace(template), embeds: [] };

  const walk = v =>
    typeof v === "string"
      ? replace(v)
      : Array.isArray(v)
        ? v.map(walk)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
          : v;

  const obj = walk(parsed);
  const content = obj.plainText ?? obj.content;
  const list = Array.isArray(obj.embeds) ? obj.embeds : EMBED_KEYS.some(k => k in obj) ? [obj] : [];
  const embeds = list.slice(0, 10).map(toEmbed);

  // JSON that has neither text nor embeds: treat the whole thing as plain text.
  if (!content && !embeds.length) return { content: replace(template), embeds: [] };

  return { content: content ? String(content) : undefined, embeds };
}
