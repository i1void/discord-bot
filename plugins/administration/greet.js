import { PermissionFlagsBits } from "discord.js";
import {
  DEFAULTS,
  getGreet,
  getGreetOrDefault,
  sendGreet,
  setGreetDelete,
  setGreetMessage,
  toggleGreet,
} from "../../lib/greet.js";
import { resolveMember } from "../../lib/parse.js";

const GROUP = "Greet & Bye";
const PERMS = [PermissionFlagsBits.ManageGuild];
const clip = (text, n) => (text.length > n ? text.slice(0, n - 1) + "…" : text);

const JSON_EXAMPLE =
  '{"title":"Welcome %user.name%!","description":"You are member #%server.members%","color":"4caf8f"}';

const SPECS = {
  greet: {
    label: "Greet",
    when: "when someone joins the server",
    on: "Greet announcements enabled on this channel.",
    delAlias: ["grdel"],
  },
  greetdm: {
    label: "DM greet",
    when: "to DM a new member when they join the server",
    on: "DM greet announcements enabled.",
  },
  bye: {
    label: "Bye",
    when: "when someone leaves the server",
    on: "Bye announcements enabled on this channel.",
  },
  boost: {
    label: "Boost",
    when: "when someone boosts the server",
    on: "Boost announcements enabled on this channel.",
  },
};

function build(type, spec) {
  const noun = spec.label.toLowerCase().replace("dm greet", "DM greet");
  const isDm = type === "greetdm";
  const base = { group: GROUP, userPerms: PERMS };

  const cmds = [];

  // .greet  -> toggle
  cmds.push({
    ...base,
    name: type,
    description: isDm
      ? `Toggles whether the bot sends a DM ${spec.when}.`
      : `Toggles announcements on the current channel ${spec.when}.`,
    usage: [`{p}${type}`],
    async run(ctx) {
      const on = toggleGreet(ctx.guild.id, type, ctx.channel.id);
      return on ? ctx.ok(spec.on) : ctx.pending(`${spec.label} announcements disabled.`);
    },
  });

  // .greetmsg -> set / show message
  cmds.push({
    ...base,
    name: `${type}msg`,
    description:
      `Sets a new ${noun} message${isDm ? "" : " shown in the current channel"}. ` +
      "With no text, shows the current message. Supports %placeholders% (see the placeholders command) and JSON embeds.",
    usage: [`{p}${type}msg [text]`],
    examples: [`{p}${type}msg ${DEFAULTS[type]}`, `{p}${type}msg ${JSON_EXAMPLE}`],
    async run(ctx) {
      const text = ctx.rest(0);

      if (!text) {
        const current = getGreet(ctx.guild.id, type)?.message_text ?? DEFAULTS[type];
        return ctx.ok(`**Current ${noun} message:**\n${clip(current, 3900)}`);
      }

      const enabled = setGreetMessage(ctx.guild.id, type, text);
      await ctx.ok(`New ${noun} message set.`);
      if (!enabled) await ctx.pending(`Enable ${noun} messages by typing \`${ctx.prefix}${type}\``);
    },
  });

  // .greetdel -> auto-delete timer
  if (!isDm) {
    cmds.push({
      ...base,
      name: `${type}del`,
      aliases: spec.delAlias ?? [],
      description: `Sets how many seconds until ${noun} messages are auto-deleted. 0 disables it. Max 600, default 30.`,
      usage: [`{p}${type}del [seconds]`],
      examples: [`{p}${type}del 0`, `{p}${type}del 30`],
      async run(ctx) {
        const seconds = ctx.args[0] === undefined ? 30 : Number(ctx.args[0]);
        if (!Number.isInteger(seconds) || seconds < 0 || seconds > 600) return ctx.usage();

        setGreetDelete(ctx.guild.id, type, seconds);
        return seconds > 0
          ? ctx.ok(`${spec.label} messages will be deleted after ${seconds} seconds.`)
          : ctx.pending(`Automatic deletion of ${noun} messages has been disabled.`);
      },
    });
  }

  // .greettest -> preview
  cmds.push({
    ...base,
    name: `${type}test`,
    description: isDm
      ? "Sends the DM greet message to yourself, or to another member, as if they just joined."
      : `Sends the ${noun} message in the current channel as if you (or another member) triggered it.`,
    usage: [`{p}${type}test [@user]`],
    examples: [`{p}${type}test`, `{p}${type}test @user`],
    async run(ctx) {
      const member = ctx.args[0] ? await resolveMember(ctx.guild, ctx.args[0]) : ctx.member;
      if (!member) return ctx.err("Member not found.");

      const conf = getGreetOrDefault(ctx.guild.id, type);

      try {
        await sendGreet(conf, {
          client: ctx.client,
          guild: ctx.guild,
          user: member.user,
          member,
          channel: ctx.channel,
        });
      } catch (err) {
        return ctx.err(
          isDm
            ? `I couldn't DM **${member.user.tag}**. Their DMs are probably closed.`
            : `Couldn't send the message: ${err.message}`
        );
      }

      if (isDm) await ctx.ok(`Sent a test DM to **${member.user.tag}**.`);
      if (!conf.is_enabled) await ctx.pending(`Enable ${noun} messages by typing \`${ctx.prefix}${type}\``);
    },
  });

  return cmds;
}

export default Object.entries(SPECS).flatMap(([type, spec]) => build(type, spec));
