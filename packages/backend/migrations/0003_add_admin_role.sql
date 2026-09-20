-- Migration number: 0003_add_admin_role
-- Add is_admin column to users table (0 = standard user, 1 = admin)
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
