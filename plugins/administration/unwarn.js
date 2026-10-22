import { PermissionFlagsBits } from "discord.js";
import db from "../../lib/db.js";
import { resolveUser } from "../../lib/parse.js";

export default {
  name: "unwarn",
  group: "Warnings",
  description: "Removes a warning from a member. Without an ID, the latest warning is removed.",
  usage: ["{p}unwarn <@user|id> [warning id]"],
  examples: ["{p}unwarn @user", "{p}unwarn @user 12"],
  userPerms: [PermissionFlagsBits.ModerateMembers],

  async run(ctx) {
    const user = await resolveUser(ctx.client, ctx.args[0]);
    if (!user) return ctx.usage();

    const id = ctx.args[1] ? Number(ctx.args[1]) : null;
    if (ctx.args[1] && !Number.isInteger(id)) return ctx.usage();

    const warn = id
      ? db
          .prepare("SELECT id FROM warns WHERE id = ? AND guild_id = ? AND user_id = ?")
          .get(id, ctx.guild.id, user.id)
      : db
          .prepare("SELECT id FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1")
          .get(ctx.guild.id, user.id);

    if (!warn) return ctx.err(`No matching warning found for **${user.tag}**.`);

    db.prepare("DELETE FROM warns WHERE id = ?").run(warn.id);

    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM warns WHERE guild_id = ? AND user_id = ?")
      .get(ctx.guild.id, user.id);

    await ctx.ok(`Removed warning #${warn.id} from **${user.tag}** (${total} left).`);
  },
};
