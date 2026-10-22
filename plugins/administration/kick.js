import { PermissionFlagsBits } from "discord.js";
import { hierarchyError } from "../../lib/checks.js";
import { resolveMember } from "../../lib/parse.js";

export default {
  name: "kick",
  group: "Moderation",
  description: "Kicks a member from the server.",
  usage: ["{p}kick <@user|id> [reason]"],
  examples: ["{p}kick @user breaking rule 3"],
  userPerms: [PermissionFlagsBits.KickMembers],
  botPerms: [PermissionFlagsBits.KickMembers],

  async run(ctx) {
    if (!ctx.args[0]) return ctx.usage();

    const member = await resolveMember(ctx.guild, ctx.args[0]);
    if (!member) return ctx.err("Member not found.");

    const problem = hierarchyError(ctx, member);
    if (problem) return ctx.err(problem);
    if (!member.kickable) return ctx.err("That member's role is higher than mine.");

    const reason = ctx.rest(1) || "No reason provided";
    await member.kick(`${ctx.author.tag}: ${reason}`.slice(0, 512));
    await ctx.ok(`**${member.user.tag}** was kicked.\n**Reason:** ${reason}`, "Kicked");
  },
};
