-- Initial schema for k5m-fashion
-- Run via: npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/001_init.sql

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outfits (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outfit_items (
  outfit_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (outfit_id, item_id),
  FOREIGN KEY (outfit_id) REFERENCES outfits(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outfit_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('hot', 'not')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(outfit_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_outfit ON votes(outfit_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit ON outfit_items(outfit_id);
