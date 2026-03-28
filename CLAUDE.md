# K5M Fashion — Fully Fashioned

## What This Is
A multi-user 'fit pic voting app. Anyone signed in can post daily outfits, others vote +/− on them, and the data reveals which wardrobe items work and which don't.

## Stack
- **Next.js 15** + TypeScript + Tailwind CSS 3
- **Cloudflare Pages** with `@cloudflare/next-on-pages`
- **Cloudflare D1** (SQLite) for vote and item storage
- **Deploy:** Push to GitHub → Cloudflare auto-builds

## Data Model

### Items (`data/items.json` + D1 `items` table)
Structured fields with auto-generated display name:

```typescript
interface Item {
  id: string;
  type: string;           // Required: "Jeans", "Hat", "Tee"
  color?: string;         // "Black", "Blue"
  modifier?: string;      // "Slim", "LA Dodgers"
  brand?: string;         // "Carhartt", "Tom Ford" (not in display name)
  size?: string;          // "M", "32x30"
  notes?: string;         // Freeform text
  category: string;       // tops, bottoms, shoes, outerwear, accessories, hats
  status: string;         // owned, packed, wishlist, retired
  tags?: string[];        // Freeform: ["capsule", "formal"]
  image?: string;
  name?: string;          // Legacy — auto-generated from structured fields
}
```

**Display name:** `getDisplayName(item)` in `lib/data.ts` — concatenates `[color, modifier, type]`.

**Status lifecycle:**
- `owned` — in wardrobe at home
- `packed` — currently with you (travel capsule)
- `wishlist` — want to get
- `retired` — no longer active

### Outfits (`data/outfits.json` + D1)
- `id`, `date`, `image`, `description`, `items[]` (item IDs), `location`, `user_id` (Clerk user ID of poster)
- Existing outfits backfilled with admin user ID via migration 004

### Votes (D1 only)
- `outfit_id`, `user_id`, `vote` ('hot'|'not')

## Multi-User Features
- **Any signed-in user can post fits** via `/post` page
- **Feed excludes own fits** — you vote on everyone else's, not your own
- **+/− voting** with percentage score display (no "hot"/"not" language)
- **Profile page** (`/profile`) shows your own fits with scores
- **Role-based nav:** signed-out sees Feed only; users see Feed/Post/My Fits/My Votes; admin also sees Items/Stats/Admin

## Pages
- `/` — Feed: vote on others' fits, archive grid of all fits
- `/post` — Upload a new fit (any signed-in user)
- `/profile` — Your posted fits with percentage scores
- `/my-votes` — Your vote history
- `/items` — Wardrobe browser (admin-only in nav)
- `/items/[id]` — Individual item detail
- `/outfits/[id]` — Individual outfit detail
- `/stats` — Analytics (admin-only in nav)
- `/admin` — Admin panel (admin-only)

## Wardrobe Page (`/items`)
Three sections:
1. **The Closet** — packed items (warm gradient)
2. **The Wardrobe** — owned items grouped by category (cool gradient)
3. **Wishlist** — wanted items
4. **Retired** — hidden by default, toggle to show

## Admin (`/admin`)
- **Structured item creation:** type (required) + color/modifier/brand/size/category/status with live name preview
- **Photo lightbox:** Click outfit thumbnails for full-screen view
- **Bulk pack:** Select owned items → pack for travel
- **Outfit management:** Upload photos, edit metadata, tag items

## API Routes
- `GET /api/outfits` — returns all outfits from D1; `?exclude_own=true` excludes current user's; `?user_id=X` filters to one user
- `POST /api/outfits/upload` — upload a new fit (requires auth, saves `user_id`)
- `POST /api/vote` — `{ outfit_id, vote: 1|0 }`
- `GET /api/votes?outfit_id=X` — returns `{ hot, not }`
- `GET /api/votes` — returns all tallies
- `GET /api/items` — returns all items with structured fields
- `POST /api/items` — create item with `{ type, color, modifier, brand, size, category, status }`
- `PATCH /api/items` — update item fields by `{ id, ...fields }`

## D1 Migrations
```bash
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/001_init.sql
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/002_seed.sql
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/003_item_structured_fields.sql
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/004_multi_user.sql
```

**Note:** Before running migration 004, replace `ADMIN_CLERK_USER_ID` with the actual admin Clerk user ID.

## Build
```bash
npm run dev          # local dev
npm run build        # standard Next.js build
npm run pages:build  # Cloudflare Pages build
```

## Deploy
Push to `master`. Cloudflare Pages auto-deploys.
- Build command: `npm run pages:build`
- Build output: `.vercel/output/static`
- Environment: `NODE_VERSION=20`

## Design
- Fonts: Helvetica Neue (primary), with stroke-outlined display text
- Colors: cream bg, ink (#0d0d0d) text, warm/cool gradients
- Aesthetic: editorial fashion lookbook meets baseball stats page
- ItemImage fallback: SVG silhouettes per category (hat, shirt, pants, shoe, jacket, glasses)

## TODO
- [x] Wire D1 database for production votes (commit 1cc6c01)
- [x] Add placeholder images for seed data (ItemImage SVG fallbacks)
- [x] Structured item fields (type/color/modifier/brand/status/tags)
- [x] Three-section wardrobe page (Closet/Wardrobe/Wishlist)
- [x] Admin: structured editor, lightbox, bulk pack
- [x] Run migration 003 on production D1 (done 2026-03-27)
- [x] **Admin item edit UI** — inline editor to edit existing items (plan: `docs/plans/2026-03-27-admin-item-edit.md`)
- [x] **Multi-user expansion** — +/− voting, /post page, /profile page, role-based nav, D1 API (plan: `docs/plans/2026-03-27-multi-user-plan.md`)
- [ ] Run migration 004 on production D1 (replace ADMIN_CLERK_USER_ID first)
- [ ] Shareholder authentication for weighted votes (deferred)

## Plans
- `docs/plans/2026-03-27-wardrobe-expansion-design.md` — Design doc for the wardrobe expansion (completed)
- `docs/plans/2026-03-27-wardrobe-expansion-plan.md` — Implementation plan for the wardrobe expansion (completed)
- `docs/plans/2026-03-27-admin-item-edit.md` — Admin inline item editor (completed)
- `docs/plans/2026-03-27-multi-user-design.md` — Design doc for multi-user expansion
- `docs/plans/2026-03-27-multi-user-plan.md` — Implementation plan for multi-user expansion (completed)
