import { PermissionFlagsBits } from "discord.js";
import { ACTIONS, disableConfig, getConfig, getIgnored, setConfig } from "../../lib/antispam.js";
import { permNames } from "../../lib/meta.js";
import { formatDuration, parseDuration } from "../../lib/parse.js";

const DEFAULT_DURATION = 10 * 60_000;
const MAX_DURATION = 28 * 86_400_000; // Discord's limit

// Permission the bot needs for each action (warn needs none).
const NEEDS = {
  mute: PermissionFlagsBits.ModerateMembers,
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
};

const LABEL = { warn: "Warn", mute: "Mute", kick: "Kick", ban: "Ban" };

export default {
  name: "antispam",
  group: "Moderation",
  description:
    "Turns on anti-spam: a member who repeats the same message that many times in a row (2-10) gets the action (warn, mute, kick or ban) and the repeats are deleted. Run it without arguments to turn it off. Members with Manage Messages are ignored.",
  usage: ["{p}antispam <messages> <action> [duration]", "{p}antispam"],
  examples: ["{p}antispam 5 mute 10m", "{p}antispam 4 kick", "{p}antispam"],
  userPerms: [PermissionFlagsBits.ManageGuild],

  async run(ctx) {
    // No arguments: turn it off (or show the usage if it's already off).
    if (!ctx.args.length) {
      if (!getConfig(ctx.guild.id)) return ctx.usage();

      disableConfig(ctx.guild.id);
      return ctx.ok(`${ctx.author} Anti-Spam has been disabled.`, "Anti-Spam Disabled");
    }

    const count = Number(ctx.args[0]);
    const input = ctx.args[1]?.toLowerCase();
    const action = input === "timeout" ? "mute" : input;
    if (!Number.isInteger(count) || count < 2 || count > 10 || !ACTIONS.includes(action)) {
      return ctx.usage();
    }

    let duration = null;
    if (ctx.args[2]) {
      if (action !== "mute") return ctx.err("A duration only works with the mute action.");

      duration = parseDuration(ctx.args[2]);
      if (!duration) return ctx.err("Invalid duration. Examples: `30m`, `2h`, `1d12h`.");
      if (duration > MAX_DURATION) return ctx.err("The maximum mute is 28 days.");
    }
    if (action === "mute") duration ??= DEFAULT_DURATION;

    const needed = NEEDS[action];
    if (needed && !ctx.guild.members.me.permissions.has(needed)) {
      return ctx.err(`I need the following permission(s) for that action: **${permNames([needed])}**`);
    }

    setConfig(ctx.guild.id, count, action, duration);

    const ignored =
      getIgnored(ctx.guild.id)
        .map(id => `<#${id}>`)
        .join(", ") || "none";
    const punishment = `**${LABEL[action]}**${duration ? ` for **${formatDuration(duration)}**` : ""}`;

    await ctx.ok(
      `${ctx.author} If a user posts **${count}** same messages in a row, I will ${punishment} them.\n` +
        `\u2003__IgnoredChannels__: ${ignored}`,
      "Anti-Spam Enabled"
    );
  },
};
