// PM2 config. Install PM2 once with: npm install -g pm2
// Then: npm run pm2:start | pm2:stop | pm2:restart | pm2:logs
module.exports = {
  apps: [
    {
      name: "discord-bot",
      script: "index.js",
      cwd: __dirname, // so .env and data/bot.db are always found, wherever PM2 is started from
      node_args: "--disable-warning=ExperimentalWarning",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      time: true, // timestamp every log line
    },
  ],
};
