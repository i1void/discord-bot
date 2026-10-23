import { PermissionFlagsBits } from "discord.js";
import { resolveUser } from "../../lib/parse.js";

export default {
  name: "unban",
  group: "Moderation",
  description: "Removes a ban, so the user can join the server again. Use the user's ID.",
  usage: ["{p}unban <@user|id> [reason]"],
  examples: ["{p}unban 123456789012345678 appealed"],
  userPerms: [PermissionFlagsBits.BanMembers],
  botPerms: [PermissionFlagsBits.BanMembers],

  async run(ctx) {
    const user = await resolveUser(ctx.client, ctx.args[0]);
    if (!user) return ctx.usage();

    const ban = await ctx.guild.bans.fetch(user.id).catch(() => null);
    if (!ban) return ctx.err("That user isn't banned.");

    const reason = ctx.rest(1) || "No reason provided";

    await ctx.guild.members.unban(user, `${ctx.author.tag}: ${reason}`.slice(0, 512));
    await ctx.ok(`**${user.tag}** was unbanned.\n**Reason:** ${reason}`, "Unbanned");
  },
};
