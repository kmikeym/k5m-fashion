# Fully Fashioned

**Dress with purpose.** A KmikeyM &times; curtmerrill collaboration.

## What Is This?

Fully Fashioned is a 'fit pic voting app. Mike posts a photo of what he's wearing each day, tags the individual clothing items, and anyone can vote **Hot** or **Not**. That's it. Binary. No hedging.

But the interesting part is what happens over time. Every outfit is tagged with the specific items worn — the black slim jeans, the Dodgers cap, the grey hoodie. As votes accumulate, the app computes correlations:

- **Per-item scoring:** If the yellow pants appear in 8 outfits and those outfits average 35% Hot, the yellow pants are a problem.
- **Pair synergy:** If the yellow pants are bad alone but score 72% Hot when paired with the Dodgers cap, the app surfaces that — those items have positive synergy. They're better together than apart.
- **Drag detection:** If every outfit containing the grey hoodie scores below average, you know what to leave in the drawer.

The more outfits and votes, the smarter the correlations get. It's collaborative filtering applied to one person's wardrobe.

## Why?

Mike is a [publicly traded person](https://kmikeym.com). Shareholders vote on his decisions. This extends that logic to something personal and low-stakes: getting dressed. Can a crowd teach you to dress better through simple binary feedback?

Also: Mike is spending two months in Kosovo starting April 2026, living out of a capsule wardrobe. This is the accountability layer — a daily 'fit check from a minimal set of pieces, with data to show which combinations work on the road.

## How It Works

1. **Post a 'fit pic** — add an outfit to `data/outfits.json`, drop the photo in `public/outfits/`
2. **People vote Hot or Not** — anonymous, one vote per outfit per browser
3. **Tag items later** — items can be empty at first. Post the pic, collect votes, then go back and tag the pieces when you have time. Votes still count; correlations update once items are tagged.
4. **Stats reveal patterns** — per-item hot rates, pair synergies, best and worst combos

This means you can batch-upload a week of photos in one push, let votes roll in, and tag everything on a lazy Sunday. The voting and the tagging are decoupled.

### Pages

- **Fits** (`/`) — The feed. Daily outfit photos with vote buttons and item tags.
- **Wardrobe** (`/items`) — Every piece in the rotation, organized by category. Tap to see how each item performs across outfits.
- **Stats** (`/stats`) — The analytics page. Item rankings, pair synergy table, and summary counts.
- **Outfit detail** (`/outfits/[id]`) — Single outfit with full item breakdown.
- **Item detail** (`/items/[id]`) — Every outfit this item appears in, with its cumulative performance.

## Adding Outfits

Edit `data/outfits.json`:
```json
{
  "id": "2026-04-05",
  "date": "2026-04-05",
  "image": "/outfits/2026-04-05.jpg",
  "description": "First day in Pristina",
  "items": ["black-slim-jeans", "white-tee", "dodgers-hat"],
  "location": "Kosovo"
}
```

Drop the photo in `public/outfits/`. Push to GitHub. Cloudflare rebuilds automatically.

## Adding Items

Edit `data/items.json`:
```json
{
  "id": "dodgers-hat",
  "name": "LA Dodgers Cap",
  "category": "hats",
  "image": "/items/dodgers-hat.jpg"
}
```

Categories: `tops`, `bottoms`, `shoes`, `outerwear`, `accessories`, `hats`

## The Math

For each item `i`:

> **hot_rate(i)** = hot votes on outfits containing i &divide; total votes on outfits containing i

For each item pair `(i, j)`:

> **synergy(i, j)** = hot_rate(outfits with both i and j) &minus; average(hot_rate(i), hot_rate(j))

Positive synergy means they're better together. Negative means they clash.

## Tech

- Next.js 15, TypeScript, Tailwind CSS
- Cloudflare Pages (auto-deploy on push)
- Cloudflare D1 (SQLite) for votes
- Fonts: Instrument Serif, DM Sans, JetBrains Mono

## Development

```bash
npm install
npm run dev
```

## History

This repo started in November 2012 as "Fully Fashioned" — a fashion project by Curt Merrill and Mike Merrill. The original idea: dress with purpose. The original code: a Django requirements file and an empty README. After 14 years of dormancy, it's back — same name, same collaborators, entirely new technology.

Made by Curt Merrill and Mike Merrill.
