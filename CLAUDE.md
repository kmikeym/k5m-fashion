# K5M Fashion — Fully Fashioned

## What This Is
A 'fit pic voting app. Mike posts daily outfits, people vote Hot or Not, and the data reveals which wardrobe items work and which don't.

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
- `id`, `date`, `image`, `description`, `items[]` (item IDs), `location`

### Votes (D1 only)
- `outfit_id`, `user_id`, `vote` ('hot'|'not')

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
```

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
- [ ] Run migration 003 on production D1 (before next deploy)
- [ ] Shareholder authentication for weighted votes (deferred)
