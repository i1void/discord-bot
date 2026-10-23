import { ok } from "../../lib/embed.js";
import { PLACEHOLDERS } from "../../lib/template.js";

export default {
  name: "placeholders",
  aliases: ["ph"],
  group: "Greet & Bye",
  description: "Lists the %placeholders% you can use in greet, bye and boost messages.",
  usage: ["{p}placeholders"],

  async run(ctx) {
    const embed = ok(
      "Messages can also be a JSON embed, e.g.\n" +
        '```json\n{"plainText":"Hi %user%","title":"Welcome!","description":"Member #%server.members%","color":"4caf8f","thumbnail":"%user.avatar%"}\n```',
      "Placeholders"
    );

    for (const [name, list] of Object.entries(PLACEHOLDERS)) {
      embed.addFields({ name, value: list.map(p => `\`${p}\``).join("\n"), inline: true });
    }
    await ctx.reply({ embeds: [embed] });
  },
};
