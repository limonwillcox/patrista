-- Reader accounts (D1 binding ACCOUNT_DB). Apply with:
--   npx wrangler d1 execute patrista-accounts --remote --file=data/account/schema.sql
-- A user is a Google account: its permanent id and email, nothing else.
CREATE TABLE IF NOT EXISTS users (
  sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- A signed-in browser. Only the hash of its token is kept.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  sub TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_sub ON sessions (sub);

-- One row per browser storage key (see server/syncKeys.ts). A NULL value is a deletion.
CREATE TABLE IF NOT EXISTS docs (
  sub TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (sub, key)
);
CREATE INDEX IF NOT EXISTS docs_sub_updated ON docs (sub, updated_at);
