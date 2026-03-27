# K5M Fashion — Fully Fashioned

## What This Is
A 'fit pic voting app. Mike posts daily outfits, people vote Hot or Not, and the data reveals which wardrobe items work and which don't.

## Stack
- **Next.js 15** + TypeScript + Tailwind CSS 3
- **Cloudflare Pages** with `@cloudflare/next-on-pages`
- **Cloudflare D1** (SQLite) for vote storage
- **Deploy:** Push to GitHub → Cloudflare auto-builds

## Data Model
- **Outfits:** `data/outfits.json` — Mike adds these manually
- **Items:** `data/items.json` — wardrobe pieces, added as needed
- **Images:** `public/outfits/` and `public/items/`
- **Votes:** Cloudflare D1 (not in repo)

## Build
```bash
npm run dev          # local dev
npm run build        # standard Next.js build
npm run pages:build  # Cloudflare Pages build
```

## Deploy
Push to `main`. Cloudflare Pages auto-deploys.
- Build command: `npm run pages:build`
- Build output: `.vercel/output/static`
- Environment: `NODE_VERSION=20`

## Design
- Fonts: Instrument Serif (display), DM Sans (body), JetBrains Mono (data)
- Colors: cream (#FAF7F2) bg, ink (#1A1A1A) text, hot (#D4503A) for fire, not (#8B9DAF) for cold
- Aesthetic: editorial fashion lookbook meets baseball stats page

## API Routes (dev mode — in-memory)
- `POST /api/vote` — `{ outfit_id, vote: 1|0 }`
- `GET /api/votes?outfit_id=X` — returns `{ hot, not }`
- `GET /api/votes` — returns all tallies

## TODO
- [x] Wire D1 database for production votes (done — commit 1cc6c01)
- [x] Add placeholder images for seed data (done — ItemImage component with fallback)
- [ ] Shareholder authentication for weighted votes (deferred — future feature)
