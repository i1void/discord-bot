import { PermissionsBitField } from "discord.js";

/** Display info per module (= folder name in plugins/). Unknown folders get a default. */
const MODULES = {
  administration: {
    label: "Administration",
    emoji: "🛠️",
    description: "Moderation, warnings, server settings and greet messages",
  },
  utility: { label: "Utility", emoji: "📎", description: "Handy everyday tools" },
  searches: { label: "Searches", emoji: "🔍", description: "Search the web and other sources" },
  ai: { label: "AI", emoji: "🤖", description: "Chat with Frieren in channels or DMs" },
  help: { label: "Help", emoji: "❓", description: "Get command help, descriptions and usage examples" },
};

export const moduleLabel = key =>
  MODULES[key]?.label ?? key.charAt(0).toUpperCase() + key.slice(1);

export const moduleEmoji = key => MODULES[key]?.emoji ?? "📦";

export const moduleDescription = key => MODULES[key]?.description ?? "";

/** [PermissionFlagsBits.BanMembers] -> "Ban Members" */
export const permNames = perms =>
  new PermissionsBitField(perms)
    .toArray()
    .map(n => n.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .join(", ");

export const fill = (text, prefix) => text.replaceAll("{p}", prefix);
