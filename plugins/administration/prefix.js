import { PermissionFlagsBits } from "discord.js";
import { getPrefix, setPrefix } from "../../lib/settings.js";

export default {
  name: "prefix",
  group: "Server",
  description: "Shows the bot's prefix, or changes it (needs Manage Server). Mention the bot to see the prefix if you forget it.",
  usage: ["{p}prefix", "{p}prefix <new prefix>"],
  examples: ["{p}prefix !"],

  async run(ctx) {
    const next = ctx.args[0];
    if (!next) return ctx.ok(`The prefix on this server is \`${getPrefix(ctx.guild.id)}\``);

    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return ctx.err("You need the following permission(s): **Manage Server**");
    }
    if (next.length > 5) return ctx.err("The prefix can be at most 5 characters.");

    setPrefix(ctx.guild.id, next);
    await ctx.ok(`The prefix is now \`${next}\``);
  },
};
