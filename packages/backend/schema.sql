-- Database Schema for Resumax (Cloudflare D1)

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    google_id TEXT UNIQUE,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Resumes Table (1 resume per user)
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    content TEXT DEFAULT '{}', -- JSON string of resume data
    theme TEXT DEFAULT 'modern',
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Refresh Tokens Table (Short-lived access tokens + long-lived rotating refresh tokens)
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resumes_slug ON resumes(slug);
CREATE UNIQUE INDEX idx_resumes_user_id_unique ON resumes(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
