import "dotenv/config";
import cfonts from "cfonts";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";

cfonts.say("Discord-Bot", { font: "tiny" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // privileged: join/leave/boost events
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages, // lets people chat with the bot in DMs
    GatewayIntentBits.MessageContent, // privileged: enable it in the Developer Portal
  ],
  partials: [
    Partials.GuildMember, // so boost detection works for members that aren't cached
    Partials.Channel, // required to receive DMs
  ],
});

const { commands, lookup } = await loadCommands();
client.commands = commands;
client.lookup = lookup;

await loadEvents(client);
await client.login(process.env.TOKEN);
