-- Migration number: 0000_initial
-- Database Schema for Resumax (Cloudflare D1)

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Resumes Table
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT DEFAULT '{}', -- JSON string of resume data
    theme TEXT DEFAULT 'modern',
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resumes_slug ON resumes(slug);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
