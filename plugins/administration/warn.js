import { PermissionFlagsBits } from "discord.js";
import { hierarchyError } from "../../lib/checks.js";
import db from "../../lib/db.js";
import { resolveUser } from "../../lib/parse.js";

export default {
  name: "warn",
  group: "Warnings",
  description: "Gives a member a warning.",
  usage: ["{p}warn <@user|id> <reason>"],
  examples: ["{p}warn @user posted an invite link"],
  userPerms: [PermissionFlagsBits.ModerateMembers],

  async run(ctx) {
    const user = await resolveUser(ctx.client, ctx.args[0]);
    const reason = ctx.rest(1);
    if (!user || !reason) return ctx.usage();

    if (user.bot) return ctx.err("Bots can't be warned.");
    if (reason.length > 100) return ctx.err("The reason can be at most 100 characters.");

    const member = await ctx.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      const problem = hierarchyError(ctx, member);
      if (problem) return ctx.err(problem);
    }

    db.prepare(
      "INSERT INTO warns (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(ctx.guild.id, user.id, ctx.author.id, reason, Date.now());

    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM warns WHERE guild_id = ? AND user_id = ?")
      .get(ctx.guild.id, user.id);

    await ctx.ok(`**${user.tag}** was warned (${total} total).\n**Reason:** ${reason}`, "Warned");
  },
};
