import { Events } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,

  run(client) {
    console.log(`Online as ${client.user.tag} (${client.commands.size} commands)`);
  },
};
