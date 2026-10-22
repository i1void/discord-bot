import { PermissionFlagsBits } from "discord.js";
import { hierarchyError } from "../../lib/checks.js";
import { resolveUser } from "../../lib/parse.js";

export default {
  name: "ban",
  group: "Moderation",
  description: "Bans a user from the server. Works on users who already left, too.",
  usage: ["{p}ban <@user|id> [reason]"],
  examples: ["{p}ban @user spamming links"],
  userPerms: [PermissionFlagsBits.BanMembers],
  botPerms: [PermissionFlagsBits.BanMembers],

  async run(ctx) {
    const user = await resolveUser(ctx.client, ctx.args[0]);
    if (!user) return ctx.usage();

    const reason = ctx.rest(1) || "No reason provided";
    const member = await ctx.guild.members.fetch(user.id).catch(() => null);

    if (member) {
      const problem = hierarchyError(ctx, member);
      if (problem) return ctx.err(problem);
      if (!member.bannable) return ctx.err("That member's role is higher than mine.");
    } else if (user.id === ctx.author.id) {
      return ctx.err("You can't do that to yourself.");
    }

    await ctx.guild.members.ban(user, { reason: `${ctx.author.tag}: ${reason}`.slice(0, 512) });
    await ctx.ok(`**${user.tag}** was banned.\n**Reason:** ${reason}`, "Banned");
  },
};
