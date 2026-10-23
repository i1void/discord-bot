## DISCORD-BOT

> Prefix based Open source Discord-bot

[![Stars](https://img.shields.io/github/stars/i1void/discord-bot?style=flat-square&color=coral)](https://github.com/i1void/discord-bot/stargazers)
[![Forks](https://img.shields.io/github/forks/i1void/discord-bot?style=flat-square)](https://github.com/i1void/discord-bot/forks)
[![License](https://img.shields.io/github/license/i1void/discord-bot?style=flat-square)](LICENSE)

### # How To

```bash
# Clone the repo
git clone https://github.com/i1void/discord-bot.git
cd discord-bot

# Install dependencies
npm install

# Copy the env file, then put your token in it
cp .env.example .env

# Start the bot
npm start
```

Auto restart with PM2: `npm install -g pm2`, then `npm run pm2:start`.

Send `.help` in Discord for the invite link and `.modules` for all commands.

### # Requirements

- Node.js 22.13 minimum (v24.22.1 recommended)
- A bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- **Server Members** and **Message Content** intents enabled for the bot

### # Database

SQLite through Node's built-in `node:sqlite`. No setup needed, the file is created at `data/bot.db` on first run.

### # Config

Set these in `.env`:

- `TOKEN` - Bot token (required)
- `PREFIX` - Default prefix, `.` if empty. Servers can change it with the `prefix` command
- `SUPPORT_URL` - Support server link shown in the help message

### # Structure

```
index.js      # Entry point
events/       # Event handlers
lib/          # Shared helpers
plugins/      # Commands, one folder per module
data/         # SQLite database (auto created)
```

### # Plugin

Add a file to `plugins/<module>/` and it loads automatically. A new folder becomes a new module.

```js
import { PermissionFlagsBits } from "discord.js";

export default {
  name: "ping",
  aliases: ["p"],                                    // optional
  description: "Replies with pong.",
  usage: ["{p}ping"],
  examples: ["{p}ping"],
  userPerms: [PermissionFlagsBits.ManageMessages],   // optional
  botPerms: [],                                      // optional
  guildOnly: true,                                   // false to allow DMs

  async run(ctx) {
    await ctx.ok("Pong!");
  },
};
```

### # Contributing

Found a bug or got an idea? Open an issue. Pull requests are welcome.
