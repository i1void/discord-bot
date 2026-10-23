import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

mkdirSync("data", { recursive: true });

const db = new DatabaseSync("data/bot.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS warns (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id     TEXT    NOT NULL,
    user_id      TEXT    NOT NULL,
    moderator_id TEXT    NOT NULL,
    reason       TEXT    NOT NULL,
    created_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    prefix   TEXT
  );

  CREATE TABLE IF NOT EXISTS greet_settings (
    guild_id     TEXT    NOT NULL,
    type         TEXT    NOT NULL,
    message_text TEXT,
    is_enabled   INTEGER NOT NULL DEFAULT 0,
    channel_id   TEXT,
    auto_delete  INTEGER NOT NULL DEFAULT 30,
    PRIMARY KEY (guild_id, type)
  );

  CREATE TABLE IF NOT EXISTS ai_channels (
    channel_id TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS antispam (
    guild_id      TEXT    PRIMARY KEY,
    message_count INTEGER NOT NULL,
    action        TEXT    NOT NULL,
    duration      INTEGER
  );

  CREATE TABLE IF NOT EXISTS antispam_ignored (
    guild_id   TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, channel_id)
  );
`);

export default db;
