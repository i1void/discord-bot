const API = "https://api.i1void.is-a.dev/ai/chatgptv2";
const PROMPT =
  "You are Frieren from Sousou no Frieren: a calm, deadpan elf mage who is a little forgetful about time. Keep replies short and answer in the same language the user writes in.";

// The API has no memory, so AI mode keeps the last few lines per channel and sends them along.
const MAX_LINES = 8;
const TTL = 10 * 60_000;
const history = new Map(); // channelId -> [{ who, text, at }]

const clip = (text, n) => (text.length > n ? text.slice(0, n) + "…" : text);

/** Asks the AI. Pass channelId to keep short-term conversation context for that channel. */
export async function askAi(text, { channelId, name = "User" } = {}) {
  const now = Date.now();
  const log = channelId ? (history.get(channelId) ?? []).filter(m => now - m.at < TTL) : [];

  const input = log.length
    ? `Conversation so far:\n${log.map(m => `${m.who}: ${m.text}`).join("\n")}\n\n` +
      `${name}: ${clip(text, 500)}\n\nReply to ${name}'s last message.`
    : clip(text, 1500);

  const query = new URLSearchParams({ text: input, prompt: PROMPT });
  const res = await fetch(`${API}?${query}`, { signal: AbortSignal.timeout(20_000) });
  const answer = ((await res.json()).result?.response ?? "...").slice(0, 2000);

  if (channelId) {
    log.push({ who: name, text: clip(text, 300), at: now }, { who: "Frieren", text: clip(answer, 300), at: now });
    history.set(channelId, log.slice(-MAX_LINES));
  }
  return answer;
}
