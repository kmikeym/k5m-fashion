# Plan: k5m-fashion to 100%

**Created:** 2026-03-27
**Status:** Approved, not yet started
**Session context:** Mike reviewed the full codebase with Claude Code. Plan was designed collaboratively and approved.

## Context

Fully Fashioned is ~95% complete. The core voting flow, stats engine, admin panel, and deployment pipeline all work. What's left is a set of polish issues: a vote error handling gap, missing visual representation of wardrobe items, silent error swallowing, and a stale CLAUDE.md. None of these require data model, API, or infrastructure changes.

**Out of scope:** Shareholder weighted votes (TODO in CLAUDE.md — a feature expansion, not completion). R2 image uploads (the git-based photo workflow works for Mike's daily posting cadence). Content tasks (tagging 13 untagged outfits, adding 15 item photos) are Mike's job — we'll make sure the code handles their absence gracefully.

---

## Key Findings from Review

- **No critical bugs** — an agent flagged the promise chain on `page.tsx:34` as broken, but it's fine (TypeScript `as` cast in arrow function returns the value)
- **Item images aren't rendered anywhere** — `data/items.json` has `image` fields for 15 items, `public/items/` is empty, but no page actually uses item images. The fix is to add rendering with fallback placeholders.
- **Vote error handling** — `OutfitCard.tsx` optimistically updates UI even when the API call fails (network error or non-409 HTTP error)
- **Silent `.catch(() => {})` in 6+ places** — errors swallowed on data-fetching pages
- **Admin env var mismatch** — `.env.local` sets `ADMIN_EMAIL` but code reads `NEXT_PUBLIC_ADMIN_EMAIL`
- **13 of 21 outfits have no items tagged** — content task for Mike, not code

---

## Changes (9 steps)

### Step 1: Fix vote error handling in OutfitCard
**File:** `components/OutfitCard.tsx`

The `vote()` function optimistically updates UI regardless of whether the API call succeeds. Network errors and non-409 HTTP errors silently fall through to `setVoted()` + count increment.

- Add `error` state
- Only set `voted`/increment counts after confirming `res.ok` or `409`
- On failure: set error flag, show brief "Couldn't save" message, auto-clear after 4s
- Move optimistic update inside the success path, after the `try/catch`

### Step 2: Create `components/ItemImage.tsx`
**New file** — reusable component for rendering item images with a styled fallback placeholder.

- Props: `item: Item`, `size: 'sm' | 'md' | 'lg'`
- Renders `<img>` with `onError` handler that switches to placeholder
- Placeholder: item's first initial in outline display type + category label below, matching the editorial aesthetic
- Sizes: `sm` = 40x48 (wardrobe list), `md` = 64x80, `lg` = full-width aspect-[3/4] (detail hero)
- `'use client'` component (needs `useState` for error tracking)

### Step 3: Add item thumbnails to wardrobe page
**File:** `app/items/page.tsx`

Add `<ItemImage item={item} size="sm" />` inside each `.data-row`, to the left of the item name. The wardrobe page currently shows a text-only list — adding thumbnails makes it an actual visual inventory for a fashion app.

### Step 4: Add item hero image to item detail page
**File:** `app/items/[id]/page.tsx`

Add `<ItemImage item={item} size="lg" />` between the back-link and the item name/stats section. When Mike adds real item photos to `public/items/`, they'll render automatically.

### Step 5: Add item thumbnails to outfit detail "Wearing" section
**File:** `app/outfits/[id]/page.tsx`

Same pattern as Step 3 — add `<ItemImage item={item} size="sm" />` next to each item in the "Wearing" list at the bottom of outfit detail pages.

### Step 6: Add outfit image fallback
**Files:** `components/OutfitCard.tsx`, `app/page.tsx`, `app/my-votes/page.tsx`, `app/admin/page.tsx`

Add `onError` handler to all `<img src={outfit.image}>` elements. On error, hide the broken image and show the outfit date as a text fallback in the container. Add supporting CSS to `app/globals.css`.

### Step 7: Improve error handling on data-fetching pages
**Files:** `app/page.tsx`, `app/stats/page.tsx`

Replace silent `.catch(() => {})` with error state that shows a subtle "Couldn't load vote data" message. The `my-votes` page already handles this adequately (shows empty state on error).

### Step 8: Fix admin env var mismatch
**Files:** `.env.local`, `components/Header.tsx`

- Rename `ADMIN_EMAIL` to `NEXT_PUBLIC_ADMIN_EMAIL` in `.env.local` (Next.js requires the prefix for client-side access)
- Update `Header.tsx` line 7 to use `process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmikeym@kmikeym.com'` instead of hardcoded string

### Step 9: Update CLAUDE.md
**File:** `CLAUDE.md`

- Check off "Wire D1 database" TODO (done in commit `1cc6c01`)
- Check off "Add placeholder images for seed data" (done via ItemImage component)
- Mark "Shareholder authentication" as future/deferred

---

## Files Modified
| File | Change |
|------|--------|
| `components/ItemImage.tsx` | **NEW** — reusable item image with fallback |
| `components/OutfitCard.tsx` | Vote error handling + outfit image fallback |
| `app/items/page.tsx` | Add item thumbnails |
| `app/items/[id]/page.tsx` | Add item hero image |
| `app/outfits/[id]/page.tsx` | Add item thumbnails in Wearing section |
| `app/page.tsx` | Outfit image fallback + fetch error handling |
| `app/my-votes/page.tsx` | Outfit image fallback |
| `app/admin/page.tsx` | Outfit image fallback |
| `app/stats/page.tsx` | Fetch error handling |
| `app/globals.css` | Fallback CSS classes |
| `components/Header.tsx` | Use env var instead of hardcoded email |
| `.env.local` | Fix env var name |
| `CLAUDE.md` | Update TODOs |

## Verification
1. `npm run dev` — confirm app starts without errors
2. Visit `/` — verify voting flow, error state on failed votes, outfit image fallback
3. Visit `/items` — confirm thumbnails render (placeholders since no images exist)
4. Visit `/items/black-slim-jeans` — confirm hero placeholder renders
5. Visit `/outfits/pxl-20250901` — confirm item thumbnails in Wearing section
6. Visit `/stats` — confirm error state renders on API failure
7. Visit `/admin` — confirm admin access still works
8. `npm run build` — confirm no build errors (TypeScript, static generation)

## Design Notes

- **Aesthetic**: editorial fashion lookbook meets baseball stats. Fonts: Instrument Serif (display), DM Sans (body), JetBrains Mono (data). Colors: cream `#FAF7F2` bg, ink `#1A1A1A` text, hot `#D4503A`, not `#8B9DAF`.
- **ItemImage placeholder** should use `txt-display-outline` for the initial letter, matching the existing heading style throughout the app.
- **Error messages** should use `txt-meta` class at reduced opacity — consistent with how the app shows secondary info.
- The app uses native `<img>` tags throughout (not Next/Image) — keep this consistent.
