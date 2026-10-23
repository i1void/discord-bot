import { Events, PermissionFlagsBits } from "discord.js";
import { askAi } from "../lib/ai.js";
import { defaultPrefix, getPrefix, isAiChannel } from "../lib/settings.js";

const COOLDOWN = 3_000;
const lastUsed = new Map(); // userId -> timestamp

export default {
  name: Events.MessageCreate,

  async run(client, message) {
    if (message.author.bot) return;

    // In DMs the bot always chats; in servers only in channels with AI mode on.
    const isDm = !message.guild;
    if (!isDm && !isAiChannel(message.channelId)) return;

    // Commands and the bare "@bot" prefix reminder are handled by messageCreate.js
    const prefix = isDm ? defaultPrefix() : getPrefix(message.guildId);
    if (message.content.startsWith(prefix)) return;
    if (message.content.trim() === `<@${client.user.id}>`) return;

    const text = message.cleanContent.trim();
    if (!text) return;

    const me = message.guild?.members.me;
    if (me && !message.channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) return;

    const now = Date.now();
    if (now - (lastUsed.get(message.author.id) ?? 0) < COOLDOWN) return;
    lastUsed.set(message.author.id, now);

    await message.channel.sendTyping().catch(() => {});

    try {
      const answer = await askAi(text, {
        channelId: message.channelId,
        name: message.member?.displayName ?? message.author.username,
      });
      await message.reply({
        content: answer,
        allowedMentions: { parse: [], repliedUser: false },
        failIfNotExists: false,
      });
    } catch (err) {
      console.error("[aiChat]", err);
    }
  },
};
