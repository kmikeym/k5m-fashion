-- Add structured fields to items table
-- Run: npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/003_item_structured_fields.sql

ALTER TABLE items ADD COLUMN type TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN color TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN modifier TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN brand TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN size TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN notes TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'owned' CHECK (status IN ('owned', 'packed', 'wishlist', 'retired'));
ALTER TABLE items ADD COLUMN tags TEXT DEFAULT '[]';

-- Migrate existing data: set type = name as fallback
UPDATE items SET type = name WHERE type = '';
