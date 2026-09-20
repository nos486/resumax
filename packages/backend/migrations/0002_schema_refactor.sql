-- Migration number: 0002_schema_refactor
-- 1. Drop unused password_hash column from users
ALTER TABLE users DROP COLUMN password_hash;

-- 2. Enforce 1 resume per user constraint
DROP INDEX IF EXISTS idx_resumes_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_id_unique ON resumes(user_id);

-- 3. Create refresh_tokens table for secure token rotation & revocation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
