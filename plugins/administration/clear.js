import { PermissionFlagsBits } from "discord.js";
import { error, pending } from "../../lib/embed.js";

const AMOUNT = 100;
const CHUNK = 10; // messages deleted per step, so the progress counter can move

const progress = n => pending(`Pruning... ${n}/${AMOUNT} messages deleted.`);

export default {
  name: "clear",
  aliases: ["prune"],
  group: "Moderation",
  description:
    "Deletes the last 100 messages in this channel. Your command and Frieren's status message disappear too. Messages older than 14 days can't be deleted.",
  usage: ["{p}clear"],
  examples: ["{p}clear"],
  userPerms: [PermissionFlagsBits.ManageMessages],
  botPerms: [PermissionFlagsBits.ManageMessages],

  async run(ctx) {
    const status = await ctx.reply({ embeds: [progress(0)] });

    // Newest first. The status message is newer than the command, so it's never part of this.
    const fetched = await ctx.channel.messages.fetch({ limit: AMOUNT, before: ctx.message.id });
    const ids = [...fetched.keys()];

    let count = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const deleted = await ctx.channel.bulkDelete(ids.slice(i, i + CHUNK), true);
      count += deleted.size;
      await status.edit({ embeds: [progress(count)] }).catch(() => {});
    }

    await ctx.message.delete().catch(() => {});

    if (count > 0) return status.delete().catch(() => {});

    // Nothing was deleted (e.g. everything is older than 14 days): say so, then clean up.
    await status
      .edit({ embeds: [error("Nothing to delete. Messages older than 14 days can't be removed.")] })
      .catch(() => {});
    setTimeout(() => status.delete().catch(() => {}), 5_000);
  },
};
