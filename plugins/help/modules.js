import { openHelp } from "../../lib/helpview.js";

export default {
  name: "modules",
  guildOnly: false,
  aliases: ["mdls"],
  description: "Lists all modules of the bot.",
  usage: ["{p}modules"],

  run: ctx => openHelp(ctx),
};
