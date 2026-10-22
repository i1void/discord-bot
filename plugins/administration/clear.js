import { PermissionFlagsBits } from "discord.js";
import { ok } from "../../lib/embed.js";

export default {
  name: "clear",
  aliases: ["prune"],
  group: "Moderation",
  description: "Deletes the last N messages in this channel (1-100). Messages older than 14 days can't be deleted.",
  usage: ["{p}clear <amount>"],
  examples: ["{p}clear 20"],
  userPerms: [PermissionFlagsBits.ManageMessages],
  botPerms: [PermissionFlagsBits.ManageMessages],

  async run(ctx) {
    const amount = Number(ctx.args[0]);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) return ctx.usage();

    // +1 so the command message itself is removed too
    const deleted = await ctx.channel.bulkDelete(amount + 1, true);
    const count = Math.max(0, deleted.size - (deleted.has(ctx.message.id) ? 1 : 0));

    const sent = await ctx.channel.send({ embeds: [ok(`Deleted **${count}** message(s).`)] });
    setTimeout(() => sent.delete().catch(() => {}), 5_000);
  },
};
