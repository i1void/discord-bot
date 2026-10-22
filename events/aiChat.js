import { Events, PermissionFlagsBits } from "discord.js";
import { askAi } from "../lib/ai.js";
import { getPrefix, isAiChannel } from "../lib/settings.js";

const COOLDOWN = 3_000;
const lastUsed = new Map(); // userId -> timestamp

export default {
  name: Events.MessageCreate,

  async run(client, message) {
    if (message.author.bot || !message.guild) return;
    if (!isAiChannel(message.channelId)) return;

    // Commands and the bare "@bot" prefix reminder are handled by messageCreate.js
    if (message.content.startsWith(getPrefix(message.guildId))) return;
    if (message.content.trim() === `<@${client.user.id}>`) return;

    const text = message.cleanContent.trim();
    if (!text) return;

    const me = message.guild.members.me;
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
