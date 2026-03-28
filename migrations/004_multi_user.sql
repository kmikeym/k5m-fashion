-- Multi-user expansion: add user_id to outfits
-- Run: npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/004_multi_user.sql

-- Add user_id column to outfits (nullable for backward compat, then backfill)
ALTER TABLE outfits ADD COLUMN user_id TEXT DEFAULT '';

-- Backfill existing outfits with admin's Clerk user ID
UPDATE outfits SET user_id = 'user_3BV6mHPORMMWnWFEzdiDeF9Po7Y' WHERE user_id = '';

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id);
