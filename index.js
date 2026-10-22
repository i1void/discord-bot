import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // privileged: join/leave/boost events
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // privileged: enable it in the Developer Portal
  ],
  partials: [Partials.GuildMember], // so boost detection works for members that aren't cached
});

const { commands, lookup } = await loadCommands();
client.commands = commands;
client.lookup = lookup;

await loadEvents(client);
await client.login(process.env.TOKEN);
