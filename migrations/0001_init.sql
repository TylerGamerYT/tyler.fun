-- tyler.fun accounts + badges (Cloudflare D1 / SQLite)
CREATE TABLE users (
  id                  TEXT PRIMARY KEY,
  username            TEXT NOT NULL,
  username_lc         TEXT NOT NULL UNIQUE,
  display_name        TEXT NOT NULL,
  email               TEXT,
  email_lc            TEXT UNIQUE,
  email_verified      INTEGER NOT NULL DEFAULT 0,
  password_hash       TEXT,                       -- NULL for GitHub-only accounts
  role                TEXT NOT NULL DEFAULT 'user'
                      CHECK (role IN ('user','support','staff','admin','owner')),
  banned              INTEGER NOT NULL DEFAULT 0,
  ban_reason          TEXT,
  bio                 TEXT NOT NULL DEFAULT '',
  username_changed_at INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE TABLE oauth_accounts (
  provider    TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_id)
);
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);

-- Only a SHA-256 hash of the session token is stored, never the token itself.
CREATE TABLE sessions (
  id_hash    TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_exp  ON sessions(expires_at);

CREATE TABLE email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('verify','reset')),
  email_lc   TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX idx_tokens_user ON email_tokens(user_id, purpose);

-- Which badges a user HOLDS (written only by server code) and whether they SHOW it.
CREATE TABLE badge_grants (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge      TEXT NOT NULL,
  granted_by TEXT,                 -- user id, or NULL for system grants
  granted_at INTEGER NOT NULL,
  displayed  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, badge)
);

CREATE TABLE audit_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        INTEGER NOT NULL,
  actor_id  TEXT,
  action    TEXT NOT NULL,
  target_id TEXT,
  detail    TEXT
);

CREATE TABLE rate_limits (
  k          TEXT PRIMARY KEY,
  count      INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
