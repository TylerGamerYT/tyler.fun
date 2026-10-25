-- Support for migrated "example" accounts that exist before anyone has logged in to them.
ALTER TABLE users ADD COLUMN unclaimed    INTEGER NOT NULL DEFAULT 0;   -- 1 = placeholder: no credentials, nobody can log in
ALTER TABLE users ADD COLUMN avatar_emoji TEXT;

-- One-time links that hand an unclaimed account to a real person (only a hash is stored).
CREATE TABLE claim_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX idx_claim_user ON claim_tokens(user_id);
