import { PermissionFlagsBits } from "discord.js";
import { hierarchyError } from "../../lib/checks.js";
import { formatDuration, parseDuration, resolveMember } from "../../lib/parse.js";

const MAX = 28 * 86_400_000; // Discord's limit

export default {
  name: "timeout",
  aliases: ["to"],
  group: "Moderation",
  description: "Temporarily stops a member from chatting. Duration like 30m, 2h, 1d12h (a bare number = minutes, max 28d). Use 0 to remove.",
  usage: ["{p}timeout <@user|id> <duration> [reason]"],
  examples: ["{p}timeout @user 10m", "{p}to @user 1d12h spam", "{p}timeout @user 0"],
  userPerms: [PermissionFlagsBits.ModerateMembers],
  botPerms: [PermissionFlagsBits.ModerateMembers],

  async run(ctx) {
    if (ctx.args.length < 2) return ctx.usage();

    const member = await resolveMember(ctx.guild, ctx.args[0]);
    if (!member) return ctx.err("Member not found.");

    const problem = hierarchyError(ctx, member);
    if (problem) return ctx.err(problem);
    if (!member.moderatable) return ctx.err("That member's role is higher than mine.");

    const reason = ctx.rest(2) || "No reason provided";

    if (ctx.args[1] === "0") {
      await member.timeout(null, `${ctx.author.tag}: ${reason}`.slice(0, 512));
      return ctx.ok(`Timeout removed from **${member.user.tag}**.`);
    }

    const ms = parseDuration(ctx.args[1]);
    if (!ms) return ctx.err("Invalid duration. Examples: `30m`, `2h`, `1d12h`.");
    if (ms > MAX) return ctx.err("The maximum timeout is 28 days.");

    await member.timeout(ms, `${ctx.author.tag}: ${reason}`.slice(0, 512));
    await ctx.ok(
      `**${member.user.tag}** was timed out for **${formatDuration(ms)}**.\n**Reason:** ${reason}`,
      "Timed out"
    );
  },
};
