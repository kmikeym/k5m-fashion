# Wardrobe Expansion Design

**Date:** 2026-03-27
**Status:** Approved

## Problem

The item data model is too thin. Items have only a name, category, and optional image. There's no way to track what you own vs. what you've retired, no structured descriptions, no tags, and no concept of a travel capsule wardrobe. The wardrobe page is a flat text list with no images.

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Whole outfits (Tuxedo, NASA Suit) | Single entity — no sub-items | Simplest model. These are voted on as one thing. |
| Item naming | Structured fields, auto-generated display name | Progressive detail: type alone is enough to start. Brand stored but hidden from name. |
| Item lifecycle | Hybrid: controlled `status` enum + freeform tags | Status handles mutual-exclusivity (owned/packed/wishlist/retired). Tags handle descriptive grouping. |
| Wardrobe page | Three sections on one page | The Closet (packed) at top, The Wardrobe (owned) below, Wishlist at bottom. Retired items toggle. |

---

## Item Data Model

```typescript
interface Item {
  id: string;

  // Display name fields — auto-generated: [color] [modifier] [type]
  type: string;          // Required. "Jeans", "Hat", "Tee", "Space Suit"
  color?: string;        // "Black", "Tan", "Blue"
  modifier?: string;     // "Slim", "Distressed", "LA Dodgers"

  // Metadata (not in display name)
  brand?: string;        // "Carhartt", "Tom Ford", "Roka"
  size?: string;         // "M", "32x30", "10.5"
  notes?: string;        // Freeform text

  // Classification
  category: 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories' | 'hats';
  status: 'owned' | 'packed' | 'wishlist' | 'retired';
  tags?: string[];       // Freeform: ["capsule", "formal", "layering"]

  image?: string;
}
```

**Display name generation:** Concatenate non-empty values of `[color, modifier, type]` with spaces. "Black" + "Slim" + "Jeans" produces "Black Slim Jeans." Just "Hat" if only type is set.

**Minimum entry:** Only `type` and `category` are required. Everything else can be filled in later from the admin panel.

---

## Wardrobe Page Layout (`/items`)

Three sections, top to bottom:

### 1. The Closet (status: packed)
- Hero section on warm gradient
- Grid of item cards (2-3 columns)
- Each card: image (or type-based placeholder), display name, category badge
- Empty state: "Nothing packed yet"
- This is the capsule wardrobe view for travel

### 2. The Wardrobe (status: owned)
- Items at home, not currently packed
- Same card layout, grouped by category
- Cool gradient background

### 3. Wishlist (status: wishlist)
- Items wanted or needed
- Lighter treatment — list with type-based placeholders
- Status can be changed to "owned" when purchased

### Retired Items
- Hidden by default
- "Show retired" toggle at bottom
- Displayed muted/faded when visible

---

## Item Detail Page (`/items/[id]`)

Expands the existing page with:
- Hero image (already built via `ItemImage` component)
- Display name + category
- Brand, size (muted metadata below name)
- Tags as chips
- Notes section
- Status badge
- Outfit history (already built)

---

## Admin Changes

### Item Editor
Fields in the admin panel when adding or editing an item:

- **Type** (required) — text input
- **Color**, **Modifier** — optional, with live preview of generated display name
- **Brand**, **Size** — optional, labeled as metadata
- **Category** — dropdown
- **Status** — radio buttons: Owned / Packed / Wishlist / Retired
- **Tags** — chip input (type + enter to add)
- **Notes** — textarea
- **Image** — upload or placeholder

### Photo Lightbox
Click any outfit photo in admin to open a full-screen overlay (dark backdrop, full-res image). Click or Escape to close. No external library.

### Bulk Pack Action
Select multiple items and set them all to "packed" at once. Useful before a trip.

---

## ItemImage Fallback Upgrade

Replace the current single-letter placeholder with type-based silhouette SVG icons:
- Hat shape for hats
- Shirt shape for tops
- Pants shape for bottoms
- Shoe shape for shoes
- Jacket shape for outerwear
- Glasses/circle shape for accessories

Falls back to the silhouette when no item image exists or when the image fails to load.

---

## Data Migration

Existing 15 items migrate to the new schema:

| Current Name | type | color | modifier | brand | status |
|-------------|------|-------|----------|-------|--------|
| Black Slim Jeans | Jeans | Black | Slim | | owned |
| White Crew Tee | Tee | White | Crew | | owned |
| LA Dodgers Cap | Cap | | LA Dodgers | | owned |
| Grey Zip Hoodie | Hoodie | Grey | Zip | | owned |
| White Sneakers | Sneakers | White | | | owned |
| Blue Crane Tee | Tee | Blue | Crane | | owned |
| Carhartt Tan LA Dodgers Hat | Hat | Tan | LA Dodgers | Carhartt | owned |
| Black Distressed Carhartt Work Pants | Work Pants | Black | Distressed | Carhartt | owned |
| Black Tom Ford Eyeglasses | Eyeglasses | Black | | Tom Ford | owned |
| NASA Space Suit | Space Suit | | NASA | | retired |
| Blue "Work Systems" Tee | Tee | Blue | "Work Systems" | | owned |
| Roka Falcon Aviator Prescription Sunglasses | Sunglasses | | Falcon Aviator Prescription | Roka | owned |
| Tuxedo | Tuxedo | | | | retired |
| Black Tee | Tee | Black | | | owned |
| Black Flight Jacket | Flight Jacket | Black | | | owned |

All items get `tags: []`. Mike sets actual status and tags from admin.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/types.ts` | Expand Item interface |
| `lib/data.ts` | Add `getDisplayName()` helper |
| `data/items.json` | Migrate to structured fields |
| `app/items/page.tsx` | Three-section wardrobe layout |
| `app/items/[id]/page.tsx` | Show brand, tags, notes, status |
| `app/admin/page.tsx` | Expanded item editor, lightbox, bulk pack |
| `components/ItemImage.tsx` | Type-based SVG fallback icons |
| `app/api/items/route.ts` | Handle new fields in create/update |
| `app/globals.css` | Lightbox styles, card grid, status badges |

## Verification

1. `npm run build` — no TypeScript errors
2. `/items` — three sections render, items sorted by status
3. `/items/[id]` — new fields display correctly
4. `/admin` — create item with just type, verify display name
5. `/admin` — edit item, add color/modifier, verify name updates
6. `/admin` — click outfit photo, lightbox opens
7. `/admin` — bulk select items, pack them, verify they move to The Closet
8. Items without images show type-based silhouette
