import { Events, PermissionFlagsBits } from "discord.js";
import { error, ok, pending, usageEmbed } from "../lib/embed.js";
import { permNames } from "../lib/meta.js";
import { defaultPrefix, getPrefix } from "../lib/settings.js";

export default {
  name: Events.MessageCreate,

  async run(client, message) {
    if (message.author.bot) return;

    const prefix = message.guild ? getPrefix(message.guildId) : defaultPrefix();

    // "@bot" alone -> tell people the prefix, so nobody gets locked out by a changed prefix.
    if (message.content.trim() === `<@${client.user.id}>`) {
      return message
        .reply({ embeds: [ok(`My prefix here is \`${prefix}\`. Try \`${prefix}help\`.`)] })
        .catch(() => {});
    }

    if (!message.content.startsWith(prefix)) return;

    const body = message.content.slice(prefix.length);
    const tokens = [...body.matchAll(/\S+/g)];
    if (!tokens.length) return;

    const cmd = client.lookup.get(tokens[0][0].toLowerCase());
    if (!cmd) return;

    // Can we even talk in this channel?
    const me = message.guild?.members.me;
    if (me) {
      const perms = message.channel.permissionsFor(me);
      if (!perms?.has(PermissionFlagsBits.SendMessages)) return;
      if (!perms.has(PermissionFlagsBits.EmbedLinks)) {
        return message.reply("I need the **Embed Links** permission in this channel.").catch(() => {});
      }
    }

    const send = payload =>
      message.reply({
        allowedMentions: { parse: [], repliedUser: false },
        failIfNotExists: false,
        ...payload,
      });

    const args = tokens.slice(1).map(t => t[0]);

    const ctx = {
      client,
      message,
      guild: message.guild,
      channel: message.channel,
      author: message.author,
      member: message.member,
      prefix,
      command: cmd,
      args,
      /** Raw text from the n-th argument onwards (keeps original spacing). */
      rest: n => (tokens[n + 1] ? body.slice(tokens[n + 1].index) : ""),
      reply: send,
      ok: (description, title) => send({ embeds: [ok(description, title)] }),
      pending: description => send({ embeds: [pending(description)] }),
      err: description => send({ embeds: [error(description)] }),
      usage: () => send({ embeds: [usageEmbed(cmd, prefix)] }),
    };

    if (cmd.guildOnly !== false && !message.guild) {
      return ctx.err("This command can only be used in a server.");
    }

    if (cmd.userPerms.length && !message.member?.permissions.has(cmd.userPerms)) {
      return ctx.err(`You need the following permission(s): **${permNames(cmd.userPerms)}**`);
    }

    if (cmd.botPerms.length && me && !me.permissions.has(cmd.botPerms)) {
      return ctx.err(`I need the following permission(s): **${permNames(cmd.botPerms)}**`);
    }

    try {
      await cmd.run(ctx);
    } catch (err) {
      console.error(`[${cmd.name}]`, err);
      await ctx.err("Something went wrong while running this command.").catch(() => {});
    }
  },
};
