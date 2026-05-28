# test-data

Reusable fixtures pulled from the live app, so any local DB or test can be seeded
with real-shaped data.

## `prod-snapshot.sql`
Full `wrangler d1 export` of the production DB (`k5m-fashion-votes`, `a61d4250`),
captured 2026-05-28: **21 outfits, 18 items, 29 votes, 21 outfit_items** (schema + data).

### Seed a database from it
```bash
# staging D1 (safe sandbox)
npx wrangler d1 execute k5m-fashion-staging-db --remote --file=test-data/prod-snapshot.sql

# a local D1 for `wrangler pages dev`
npx wrangler d1 execute k5m-fashion-votes --local --file=test-data/prod-snapshot.sql
```

### Refresh the snapshot
```bash
npx wrangler d1 export k5m-fashion-votes --remote --output test-data/prod-snapshot.sql
```

Note: photos referenced by these rows live in `public/outfits/`. Per Mike (2026-05-28),
existing prod data is disposable — new test pics can be uploaded later.
