import { OAuth2Scopes, PermissionFlagsBits as P } from "discord.js";
import { ok } from "../../lib/embed.js";
import { openHelp } from "../../lib/helpview.js";

// What the invite link asks for: everything the commands need.
const INVITE_PERMS = [
  P.ViewChannel,
  P.SendMessages,
  P.EmbedLinks,
  P.ReadMessageHistory,
  P.AddReactions,
  P.ManageMessages,
  P.KickMembers,
  P.BanMembers,
  P.ModerateMembers,
];

function overview({ client, prefix }) {
  const invite = client.generateInvite({ scopes: [OAuth2Scopes.Bot], permissions: INVITE_PERMS });

  const embed = ok(invite, "To invite me to your server, use this link")
    .setThumbnail(client.user.displayAvatarURL())
    .addFields({
      name: "Useful help commands",
      value: [
        `\`${prefix}modules\` Lists all bot modules.`,
        `\`${prefix}h CommandName\` Shows some help about a specific command.`,
        `\`${prefix}commands ModuleName\` Lists all commands in a module.`,
      ].join("\n"),
    });

  if (process.env.SUPPORT_URL) {
    embed.addFields({ name: "Support Server", value: process.env.SUPPORT_URL });
  }
  return embed;
}

/** In a server: DM the overview and react with a check mark. In DMs: just reply. */
async function sendOverview(ctx) {
  const embed = overview(ctx);
  if (!ctx.guild) return ctx.reply({ embeds: [embed] });

  try {
    await ctx.author.send({ embeds: [embed] });
  } catch {
    return ctx.err("I can't DM you. Please allow direct messages from server members and try again.");
  }
  await ctx.message.react("✅").catch(() => {});
}

export default {
  name: "help",
  aliases: ["h"],
  guildOnly: false,
  description: "Sends you a DM with a short help overview, or shows details about a single command.",
  usage: ["{p}help", "{p}help <command>"],
  examples: ["{p}help", "{p}h ban"],

  async run(ctx) {
    const raw = ctx.args[0]?.toLowerCase();
    const name = raw?.startsWith(ctx.prefix) ? raw.slice(ctx.prefix.length) : raw;
    if (!name) return sendOverview(ctx);

    const cmd = ctx.client.lookup.get(name);
    if (!cmd || cmd.hidden) {
      return ctx.err(`Command \`${name}\` not found. Try \`${ctx.prefix}modules\`.`);
    }
    return openHelp(ctx, { view: "command", name: cmd.name });
  },
};
