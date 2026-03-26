# Fully Fashioned

**Dress with purpose.** A KmikeyM &times; curtmerrill collaboration.

Rate daily outfits. The data reveals which pieces work — and which ones need to stay in the drawer.

## How It Works

1. **Post a 'fit pic** — add an outfit to `data/outfits.json` with tagged items
2. **People vote Hot or Not** — binary, anonymous, one vote per outfit
3. **Stats reveal patterns** — which items score high? Which pairs have synergy? Which piece is dragging everything down?

The more outfits and votes, the smarter the correlations get.

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

## Tech

- Next.js 15, TypeScript, Tailwind CSS
- Cloudflare Pages (auto-deploy on push)
- Cloudflare D1 (SQLite) for votes

## Development

```bash
npm install
npm run dev
```

## History

This repo started in November 2012 as "Fully Fashioned" — a fashion project by Curt Merrill and Mike Merrill. After 14 years of dormancy, it's back.

Made by Curt Merrill and Mike Merrill.
