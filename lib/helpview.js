import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
} from "discord.js";
import { ok } from "./embed.js";
import { fill, moduleDescription, moduleEmoji, moduleLabel, permNames } from "./meta.js";

const PAGE_SIZE = 25; // Discord select menus hold at most 25 options

/** module name -> sorted visible commands */
function collect(commands) {
  const modules = new Map();
  const sorted = [...commands.values()]
    .filter(c => !c.hidden)
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  for (const cmd of sorted) {
    if (!modules.has(cmd.module)) modules.set(cmd.module, []);
    modules.get(cmd.module).push(cmd);
  }
  return new Map([...modules].sort(([a], [b]) => a.localeCompare(b)));
}

const row = (...components) => new ActionRowBuilder().addComponents(...components);
const button = (id, label, disabled = false) =>
  new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled);
const escapeMd = text => text.replace(/[\\*_~`|>#\[-]/g, "\\$&"); // so a prefix like * or _ can't break the formatting
const clip = (text, n) => (text.length > n ? text.slice(0, n - 1) + "…" : text);

/**
 * Interactive help: modules -> commands of a module (grouped by submodule) -> command details.
 * state: { view: "modules" } | { view: "module", module, page } | { view: "command", name }
 */
export async function openHelp(ctx, state = { view: "modules" }) {
  const { prefix } = ctx;
  const modules = collect(ctx.client.commands);

  const renderModules = () => {
    const embed = ok(`Select a module below to see its commands.`, "List of modules");

    for (const key of modules.keys()) {
      const description = moduleDescription(key);
      embed.addFields({
        name: `${moduleEmoji(key)} ${moduleLabel(key)}`,
        value: (description ? `${description}\n` : "") + `\`${prefix}cmds ${key}\``,
        inline: false,
      });
    }
    embed.setFooter({ text: `${prefix}help <command> for details on a single command` });

    const select = new StringSelectMenuBuilder()
      .setCustomId("help:module")
      .setPlaceholder("Select a module to see its commands")
      .addOptions(
        [...modules.keys()].map(key => ({
          label: moduleLabel(key),
          value: key,
          emoji: moduleEmoji(key),
          description: clip(moduleDescription(key), 100) || undefined,
        }))
      );

    return { embeds: [embed], components: [row(select)] };
  };

  const renderModule = () => {
    const cmds = modules.get(state.module);
    const pageCount = Math.max(1, Math.ceil(cmds.length / PAGE_SIZE));
    const slice = cmds.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);

    const embed = ok(null, `${moduleEmoji(state.module)} ${moduleLabel(state.module)}`);

    const groups = new Map();
    for (const c of slice) {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group).push(escapeMd(`${prefix}${c.name}`));
    }
    for (const [name, lines] of groups) {
      embed.addFields({ name, value: lines.join("\n"), inline: true });
    }
    embed.setFooter({
      text: `Page ${state.page + 1}/${pageCount} • ${prefix}help <command> for details`,
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId("help:command")
      .setPlaceholder("Select a command to see its details")
      .addOptions(
        slice.map(c => ({
          label: `${prefix}${c.name}`,
          value: c.name,
          description: clip(c.description ?? "", 100) || undefined,
        }))
      );

    return {
      embeds: [embed],
      components: [
        row(select),
        row(
          button("help:modules", "Modules"),
          button("help:prev", "◀", state.page === 0),
          button("help:next", "▶", state.page >= pageCount - 1)
        ),
      ],
    };
  };

  const renderCommand = () => {
    const cmd = ctx.client.commands.get(state.name);
    const title = [cmd.name, ...cmd.aliases].map(n => `${prefix}${n}`).join(" / ");
    const embed = ok(cmd.description ?? "No description.", title);

    if (cmd.usage.length) {
      embed.addFields({
        name: "Usage",
        value: "```\n" + cmd.usage.map(u => fill(u, prefix)).join("\n") + "\n```",
      });
    }
    if (cmd.examples.length) {
      embed.addFields({
        name: "Examples",
        value: "```\n" + cmd.examples.map(u => fill(u, prefix)).join("\n") + "\n```",
      });
    }
    if (cmd.userPerms.length) {
      embed.addFields({ name: "Requires", value: permNames(cmd.userPerms), inline: true });
    }
    embed.setFooter({ text: `${moduleLabel(cmd.module)} • ${cmd.group}` });

    return {
      embeds: [embed],
      components: [row(button("help:back", `Back to ${moduleLabel(cmd.module)}`), button("help:modules", "Modules"))],
    };
  };

  const render = () =>
    state.view === "modules" ? renderModules() : state.view === "module" ? renderModule() : renderCommand();

  const msg = await ctx.reply(render());
  const collector = msg.createMessageComponentCollector({ time: 120_000 });

  collector.on("collect", async i => {
    if (i.user.id !== ctx.author.id) {
      return i.reply({
        content: "Only the person who ran the command can use this menu.",
        flags: MessageFlags.Ephemeral,
      });
    }

    switch (i.customId) {
      case "help:module":
        state = { view: "module", module: i.values[0], page: 0 };
        break;
      case "help:command":
        state = { view: "command", name: i.values[0] };
        break;
      case "help:modules":
        state = { view: "modules" };
        break;
      case "help:back": {
        const cmd = ctx.client.commands.get(state.name);
        const index = modules.get(cmd.module).indexOf(cmd);
        state = { view: "module", module: cmd.module, page: Math.floor(index / PAGE_SIZE) };
        break;
      }
      case "help:prev":
        state = { ...state, page: state.page - 1 };
        break;
      case "help:next":
        state = { ...state, page: state.page + 1 };
        break;
    }
    await i.update(render());
  });

  collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
}

export { collect };
