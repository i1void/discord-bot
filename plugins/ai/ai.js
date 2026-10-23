import { askAi } from "../../lib/ai.js";

export default {
  name: "ai",
  group: "Chat",
  description:
    "Chat with Frieren. For hands-free chatting, turn on AI mode with the aimode command. In DMs no command is needed, just write a message.",
  usage: ["{p}ai <message>"],
  examples: ["{p}ai how old are you?"],
  guildOnly: false,

  async run(ctx) {
    const text = ctx.rest(0);
    if (!text) return ctx.usage();

    await ctx.channel.sendTyping().catch(() => {});

    try {
      await ctx.reply({ content: await askAi(text) });
    } catch {
      await ctx.err("Sorry, I can't answer right now.");
    }
  },
};
