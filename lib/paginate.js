import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";

/**
 * Sends an embed with ◀ ▶ buttons. Only the person who ran the command can flip pages.
 * render(page) -> EmbedBuilder (page is 0-based; may be async).
 */
export async function paginate(ctx, { pageCount, render, time = 60_000 }) {
  let page = 0;

  const build = async () => {
    const embed = await render(page);
    if (pageCount > 1) embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });

    const components =
      pageCount > 1
        ? [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("pg:prev")
                .setEmoji("◀️")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
              new ButtonBuilder()
                .setCustomId("pg:next")
                .setEmoji("▶️")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === pageCount - 1)
            ),
          ]
        : [];

    return { embeds: [embed], components };
  };

  const msg = await ctx.reply(await build());
  if (pageCount <= 1) return msg;

  const collector = msg.createMessageComponentCollector({ time });

  collector.on("collect", async i => {
    if (i.user.id !== ctx.author.id) {
      return i.reply({
        content: "Only the person who ran the command can use these buttons.",
        flags: MessageFlags.Ephemeral,
      });
    }
    page += i.customId === "pg:next" ? 1 : -1;
    await i.update(await build());
  });

  collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  return msg;
}
