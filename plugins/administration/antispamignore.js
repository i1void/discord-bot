import { PermissionFlagsBits } from "discord.js";
import { toggleIgnored } from "../../lib/antispam.js";

export default {
  name: "antispamignore",
  group: "Moderation",
  description: "Toggles whether anti-spam skips this channel (handy for bot or spam channels).",
  usage: ["{p}antispamignore"],
  userPerms: [PermissionFlagsBits.ManageGuild],

  async run(ctx) {
    const nowIgnored = toggleIgnored(ctx.guild.id, ctx.channel.id);

    await ctx.ok(
      nowIgnored
        ? `Anti-spam will now **skip** ${ctx.channel}.`
        : `Anti-spam will **watch** ${ctx.channel} again.`
    );
  },
};
