import { openHelp } from "../../lib/helpview.js";

export default {
  name: "help",
  aliases: ["h"],
  description: "Shows the list of modules, or details about a single command.",
  usage: ["{p}help", "{p}help <command>"],
  examples: ["{p}help", "{p}h ban"],

  async run(ctx) {
    const raw = ctx.args[0]?.toLowerCase();
    const name = raw?.startsWith(ctx.prefix) ? raw.slice(ctx.prefix.length) : raw;
    if (!name) return openHelp(ctx);

    const cmd = ctx.client.lookup.get(name);
    if (!cmd || cmd.hidden) {
      return ctx.err(`Command \`${name}\` not found. Try \`${ctx.prefix}modules\`.`);
    }
    return openHelp(ctx, { view: "command", name: cmd.name });
  },
};
