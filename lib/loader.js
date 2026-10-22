import { readdirSync } from "node:fs";
import { Collection } from "discord.js";
import { moduleLabel } from "./meta.js";

/**
 * Loads every command in plugins/<module>/<name>.js.
 * Returns { commands: name -> command, lookup: name-or-alias -> command }.
 */
export async function loadCommands() {
  const commands = new Collection();
  const lookup = new Collection();
  const root = new URL("../plugins/", import.meta.url);

  for (const dirent of readdirSync(root, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;

    const module = dirent.name;
    const dir = new URL(`${module}/`, root);

    for (const file of readdirSync(dir).filter(f => f.endsWith(".js"))) {
      const { default: exported } = await import(new URL(file, dir));

      // A file may export one command or an array of them (handy for families like greet/bye).
      for (const cmd of [].concat(exported)) {
        const command = {
          aliases: [],
          usage: [],
          examples: [],
          userPerms: [],
          botPerms: [],
          ...cmd,
          module,
          group: cmd.group ?? moduleLabel(module),
        };

        for (const key of [command.name, ...command.aliases]) {
          if (lookup.has(key)) {
            throw new Error(`Duplicate command name/alias "${key}" in plugins/${module}/${file}`);
          }
          lookup.set(key, command);
        }
        commands.set(command.name, command);
      }
    }
  }

  return { commands, lookup };
}

/** Loads every event in events/*.js. Each exports { name, once?, run(client, ...args) }. */
export async function loadEvents(client) {
  const dir = new URL("../events/", import.meta.url);

  for (const file of readdirSync(dir).filter(f => f.endsWith(".js"))) {
    const { default: exported } = await import(new URL(file, dir));

    for (const event of [].concat(exported)) {
      const handler = (...args) =>
        Promise.resolve(event.run(client, ...args)).catch(err => console.error(`[event ${event.name}]`, err));

      if (event.once) client.once(event.name, handler);
      else client.on(event.name, handler);
    }
  }
}
