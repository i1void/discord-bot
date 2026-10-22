import { PermissionFlagsBits } from "discord.js";
import { toggleAiChannel } from "../../lib/settings.js";

export default {
  name: "aimode",
  group: "Chat",
  description:
    "Toggles AI mode in this channel. While it's on, Frieren answers every message here without a prefix. Messages that start with the prefix are still treated as commands.",
  usage: ["{p}aimode"],
  userPerms: [PermissionFlagsBits.ManageChannels],

  async run(ctx) {
    const on = toggleAiChannel(ctx.guild.id, ctx.channel.id);

    await ctx.ok(
      on
        ? `AI mode is **on** in ${ctx.channel}. I'll answer every message here. Run \`${ctx.prefix}aimode\` again to turn it off.`
        : `AI mode is **off** in ${ctx.channel}.`
    );
  },
};
