// One-time cleanup: removes the old slash commands still registered on Discord.
// Run once with: npm run clear-slash
import "dotenv/config";
import { REST, Routes } from "discord.js";

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;
const rest = new REST().setToken(TOKEN);

await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

console.log("Old slash commands removed.");
