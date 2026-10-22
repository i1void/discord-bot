import { EmbedBuilder } from "discord.js";
import { fill } from "./meta.js";

export const COLORS = { ok: 0x4caf8f, error: 0xe05555, pending: 0xf0b132 };

/** Default green embed. Every bot response should go through these so the look stays consistent. */
export function ok(description, title) {
  const e = new EmbedBuilder().setColor(COLORS.ok);
  if (description) e.setDescription(description);
  if (title) e.setTitle(title);
  return e;
}

/** Yellow embed for "turned off" / "needs attention" style messages. */
export const pending = description =>
  new EmbedBuilder().setColor(COLORS.pending).setDescription(description);

export const error = description =>
  new EmbedBuilder().setColor(COLORS.error).setDescription(description);

/** Shown when a command gets bad arguments. */
export function usageEmbed(cmd, prefix) {
  const e = new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`${prefix}${cmd.name}`)
    .setDescription(cmd.description ?? "");

  if (cmd.usage?.length) {
    e.addFields({ name: "Usage", value: "```\n" + cmd.usage.map(u => fill(u, prefix)).join("\n") + "\n```" });
  }
  return e;
}
