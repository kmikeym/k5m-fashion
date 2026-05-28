-- 005: Adaptive Instrument baseline + anonymous voting
-- Run (staging first):
--   npx wrangler d1 execute k5m-fashion-staging-db --remote --file=migrations/005_instrument_and_anon.sql
-- Then production:
--   npx wrangler d1 execute k5m-fashion-votes --remote --file=migrations/005_instrument_and_anon.sql
-- All statements are additive ADD COLUMN — existing rows keep working via defaults.

-- 005a: baseline of THE INSTRUMENT score at post time, for the "revised" trust marker.
-- NULL until backfilled (see /api/instrument/backfill). A live score differing from
-- the baseline by >= 0.1 surfaces a "revised" affordance on the outfit screen.
ALTER TABLE outfits ADD COLUMN instrument_baseline REAL;

-- 005b: anonymous voting. votes.user_id now holds either a Clerk user id or an
-- anonymous device-token UUID; voter_type disambiguates. UNIQUE(outfit_id, user_id)
-- continues to dedup either kind. Existing rows are real users (default 'user').
ALTER TABLE votes ADD COLUMN voter_type TEXT NOT NULL DEFAULT 'user'; -- 'user' | 'anon'
