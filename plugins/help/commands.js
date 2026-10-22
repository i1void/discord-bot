import { collect, openHelp } from "../../lib/helpview.js";
import { moduleLabel } from "../../lib/meta.js";

export default {
  name: "commands",
  aliases: ["cmds"],
  description: "Lists all commands in a module.",
  usage: ["{p}commands <module>"],
  examples: ["{p}commands administration"],

  async run(ctx) {
    const input = ctx.args[0]?.toLowerCase();
    if (!input) return ctx.usage();

    const modules = collect(ctx.client.commands);
    const key = [...modules.keys()].find(k => k === input || moduleLabel(k).toLowerCase() === input);

    if (!key) {
      return ctx.err(
        `Module \`${input}\` not found. Available: ${[...modules.keys()].map(k => `\`${k}\``).join(", ")}`
      );
    }
    return openHelp(ctx, { view: "module", module: key, page: 0 });
  },
};
