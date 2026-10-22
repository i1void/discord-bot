import { PermissionsBitField } from "discord.js";

/** Display info per module (= folder name in plugins/). Unknown folders get a default. */
const MODULES = {
  administration: { label: "Administration", emoji: "🛠️" },
  utility: { label: "Utility", emoji: "📎" },
  searches: { label: "Searches", emoji: "🔍" },
  ai: { label: "AI", emoji: "🤖" },
  help: { label: "Help", emoji: "❓" },
};

export const moduleLabel = key =>
  MODULES[key]?.label ?? key.charAt(0).toUpperCase() + key.slice(1);

export const moduleEmoji = key => MODULES[key]?.emoji ?? "📦";

/** [PermissionFlagsBits.BanMembers] -> "Ban Members" */
export const permNames = perms =>
  new PermissionsBitField(perms)
    .toArray()
    .map(n => n.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .join(", ");

export const fill = (text, prefix) => text.replaceAll("{p}", prefix);
