-- Migration number: 0001_google_auth
-- Adds google_id column to support Google OAuth login

ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
