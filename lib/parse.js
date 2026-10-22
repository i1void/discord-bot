const ID = /^(?:<@!?(\d{17,20})>|(\d{17,20}))$/;

/** "<@123>" or "123" -> "123" (or null) */
export function userId(text) {
  const m = ID.exec(text ?? "");
  return m ? (m[1] ?? m[2]) : null;
}

export async function resolveUser(client, text) {
  const id = userId(text);
  return id ? client.users.fetch(id).catch(() => null) : null;
}

export async function resolveMember(guild, text) {
  const id = userId(text);
  return id ? guild.members.fetch(id).catch(() => null) : null;
}

const UNITS = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000 };

/** "1h30m" -> ms. A bare number counts as minutes. Returns null if invalid. */
export function parseDuration(text) {
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text) * UNITS.m;
  if (!/^(\d+[dhms])+$/i.test(text)) return null;

  let total = 0;
  for (const [, n, unit] of text.matchAll(/(\d+)([dhms])/gi)) {
    total += Number(n) * UNITS[unit.toLowerCase()];
  }
  return total || null;
}

/** ms -> "1d 2h 30m" */
export function formatDuration(ms) {
  const parts = [];
  for (const [unit, size] of Object.entries(UNITS)) {
    const n = Math.floor(ms / size);
    if (n) parts.push(`${n}${unit}`);
    ms -= n * size;
  }
  return parts.join(" ") || "0s";
}
