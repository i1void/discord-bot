import { PermissionFlagsBits } from "discord.js";
import db from "../../lib/db.js";
import { ok } from "../../lib/embed.js";
import { paginate } from "../../lib/paginate.js";
import { resolveUser } from "../../lib/parse.js";

const PER_PAGE = 10;

export default {
  name: "warnings",
  aliases: ["warnlog"],
  group: "Warnings",
  description: "Shows a member's warning history.",
  usage: ["{p}warnings <@user|id>"],
  examples: ["{p}warnings @user"],
  userPerms: [PermissionFlagsBits.ModerateMembers],

  async run(ctx) {
    const user = await resolveUser(ctx.client, ctx.args[0]);
    if (!user) return ctx.usage();

    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM warns WHERE guild_id = ? AND user_id = ?")
      .get(ctx.guild.id, user.id);

    if (!total) return ctx.ok(`**${user.tag}** has no warnings.`);

    await paginate(ctx, {
      pageCount: Math.ceil(total / PER_PAGE),
      render: page => {
        const rows = db
          .prepare(
            "SELECT id, moderator_id, reason, created_at FROM warns " +
              "WHERE guild_id = ? AND user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?"
          )
          .all(ctx.guild.id, user.id, PER_PAGE, page * PER_PAGE);

        const lines = rows.map(
          r => `**#${r.id}** <t:${Math.floor(r.created_at / 1000)}:d> — ${r.reason} (by <@${r.moderator_id}>)`
        );
        return ok(lines.join("\n"), `Warnings for ${user.tag} (${total})`);
      },
    });
  },
};
