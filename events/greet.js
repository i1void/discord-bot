import { Events } from "discord.js";
import { clearGuildGreets, deliver, disableGreet, enqueue, getGreet } from "../lib/greet.js";

async function textChannel(guild, id) {
  if (!id) return null;
  const ch = guild.channels.cache.get(id) ?? (await guild.channels.fetch(id).catch(() => null));
  return ch?.isTextBased() && !ch.isDMBased() ? ch : null;
}

/** Queue a channel message of this type, if enabled. */
async function announce(client, type, { guild, user, member }) {
  const conf = getGreet(guild.id, type);
  if (!conf?.is_enabled) return;

  const channel = await textChannel(guild, conf.channel_id);
  if (!channel) {
    disableGreet(guild.id, type); // channel was deleted
    return;
  }
  enqueue(() => deliver(conf, { client, guild, user, member, channel }));
}

export default [
  {
    name: Events.GuildMemberAdd,
    async run(client, member) {
      await announce(client, "greet", { guild: member.guild, user: member.user, member });

      const dm = getGreet(member.guild.id, "greetdm");
      if (dm?.is_enabled) {
        enqueue(() => deliver(dm, { client, guild: member.guild, user: member.user, member }));
      }
    },
  },

  {
    name: Events.GuildMemberRemove,
    run: (client, member) => announce(client, "bye", { guild: member.guild, user: member.user, member }),
  },

  {
    name: Events.GuildMemberUpdate,
    async run(client, oldMember, newMember) {
      const newTs = newMember.premiumSinceTimestamp;
      if (!newTs) return;

      // New booster, or boosted again. If we didn't have the old member cached,
      // fall back to "started boosting in the last 30 seconds".
      const oldKnown = !oldMember.partial && oldMember.premiumSinceTimestamp !== undefined;
      const boosted = oldKnown
        ? oldMember.premiumSinceTimestamp === null || newTs > oldMember.premiumSinceTimestamp
        : Date.now() - newTs < 30_000;
      if (!boosted) return;

      await announce(client, "boost", { guild: newMember.guild, user: newMember.user, member: newMember });
    },
  },

  {
    // Bot was removed from a server: forget its greet settings (ignore temporary outages).
    name: Events.GuildDelete,
    run(client, guild) {
      if (guild.available === false) return;
      clearGuildGreets(guild.id);
    },
  },
];
