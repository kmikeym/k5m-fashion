# Wardrobe Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the item data model with structured fields (type/color/modifier/brand/size/status/tags/notes), rebuild the wardrobe page with three sections (Closet/Wardrobe/Wishlist), upgrade the admin item editor, and add photo lightbox.

**Architecture:** Items gain structured name fields that auto-generate a display name, a lifecycle `status` enum, and freeform tags. The JSON data file and D1 schema both expand. A `getDisplayName()` helper centralizes name generation. The wardrobe page filters by status to render three sections.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare D1 (SQLite), Tailwind CSS, Edge Runtime

**Design doc:** `docs/plans/2026-03-27-wardrobe-expansion-design.md`

---

## Task 1: Expand Item type and add display name helper

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/data.ts`

**Step 1: Update Item interface**

Replace the existing `Item` interface in `lib/types.ts`:

```typescript
export interface Item {
  id: string;

  // Display name = auto-generated from [color] [modifier] [type]
  type: string;
  color?: string;
  modifier?: string;

  // Hidden metadata
  brand?: string;
  size?: string;
  notes?: string;

  // Classification
  category: 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories' | 'hats';
  status: 'owned' | 'packed' | 'wishlist' | 'retired';
  tags?: string[];

  image?: string;

  // Legacy — kept for backward compat during migration, can be removed later
  name?: string;
}
```

**Step 2: Add getDisplayName() to lib/data.ts**

Add this function after the existing imports:

```typescript
export function getDisplayName(item: Item): string {
  const parts = [item.color, item.modifier, item.type].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return item.name || item.id;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build fails — items.json doesn't match new interface yet. That's fine, Task 2 fixes it.

**Step 4: Commit**

```
feat: expand Item interface with structured fields and display name helper
```

---

## Task 2: Migrate items.json to structured fields

**Files:**
- Modify: `data/items.json`

**Step 1: Replace items.json with migrated data**

Each item gets: `type`, `color`, `modifier`, `brand`, `status`, `tags`, plus the legacy `name` field preserved for any code that still reads it.

```json
[
  {
    "id": "black-slim-jeans",
    "type": "Jeans",
    "color": "Black",
    "modifier": "Slim",
    "name": "Black Slim Jeans",
    "category": "bottoms",
    "status": "owned",
    "tags": [],
    "image": "/items/black-slim-jeans.jpg"
  },
  {
    "id": "white-tee",
    "type": "Tee",
    "color": "White",
    "modifier": "Crew",
    "name": "White Crew Tee",
    "category": "tops",
    "status": "owned",
    "tags": [],
    "image": "/items/white-tee.jpg"
  },
  {
    "id": "dodgers-hat",
    "type": "Cap",
    "modifier": "LA Dodgers",
    "name": "LA Dodgers Cap",
    "category": "hats",
    "status": "owned",
    "tags": [],
    "image": "/items/dodgers-hat.jpg"
  },
  {
    "id": "grey-hoodie",
    "type": "Hoodie",
    "color": "Grey",
    "modifier": "Zip",
    "name": "Grey Zip Hoodie",
    "category": "outerwear",
    "status": "owned",
    "tags": [],
    "image": "/items/grey-hoodie.jpg"
  },
  {
    "id": "white-sneakers",
    "type": "Sneakers",
    "color": "White",
    "name": "White Sneakers",
    "category": "shoes",
    "status": "owned",
    "tags": [],
    "image": "/items/white-sneakers.jpg"
  },
  {
    "id": "blue-crane-tee",
    "type": "Tee",
    "color": "Blue",
    "modifier": "Crane",
    "name": "Blue Crane Tee",
    "category": "tops",
    "status": "owned",
    "tags": [],
    "image": "/items/blue-crane-tee.jpg"
  },
  {
    "id": "carharrt-tan-la-dodgers-hat",
    "type": "Hat",
    "color": "Tan",
    "modifier": "LA Dodgers",
    "brand": "Carhartt",
    "name": "Carhartt Tan LA Dodgers Hat",
    "category": "hats",
    "status": "owned",
    "tags": [],
    "image": "/items/carharrt-tan-la-dodgers-hat.jpg"
  },
  {
    "id": "black-distressed-carharrt-work-pants",
    "type": "Work Pants",
    "color": "Black",
    "modifier": "Distressed",
    "brand": "Carhartt",
    "name": "Black Distressed Carhartt Work Pants",
    "category": "bottoms",
    "status": "owned",
    "tags": [],
    "image": "/items/black-distressed-carharrt-work-pants.jpg"
  },
  {
    "id": "black-tom-ford-eyeglasses",
    "type": "Eyeglasses",
    "color": "Black",
    "brand": "Tom Ford",
    "name": "Black Tom Ford Eyeglasses",
    "category": "accessories",
    "status": "owned",
    "tags": [],
    "image": "/items/black-tom-ford-eyeglasses.jpg"
  },
  {
    "id": "nasa-space-suit",
    "type": "Space Suit",
    "modifier": "NASA",
    "name": "NASA Space Suit",
    "category": "outerwear",
    "status": "retired",
    "tags": [],
    "image": "/items/nasa-space-suit.jpg"
  },
  {
    "id": "blue-work-systems-tee",
    "type": "Tee",
    "color": "Blue",
    "modifier": "\"Work Systems\"",
    "name": "Blue \"Work Systems\" Tee",
    "category": "tops",
    "status": "owned",
    "tags": [],
    "image": "/items/blue-work-systems-tee.jpg"
  },
  {
    "id": "roka-falcon-aviator-prescription-sunglasses",
    "type": "Sunglasses",
    "modifier": "Falcon Aviator Prescription",
    "brand": "Roka",
    "name": "Roka Falcon Aviator Prescription Sunglasses",
    "category": "accessories",
    "status": "owned",
    "tags": [],
    "image": "/items/roka-falcon-aviator-prescription-sunglasses.jpg"
  },
  {
    "id": "tuxedo",
    "type": "Tuxedo",
    "name": "Tuxedo",
    "category": "outerwear",
    "status": "retired",
    "tags": [],
    "image": "/items/tuxedo.jpg"
  },
  {
    "id": "black-tee",
    "type": "Tee",
    "color": "Black",
    "name": "Black Tee",
    "category": "tops",
    "status": "owned",
    "tags": [],
    "image": "/items/black-tee.jpg"
  },
  {
    "id": "black-flight-jacket",
    "type": "Flight Jacket",
    "color": "Black",
    "name": "Black Flight Jacket",
    "category": "outerwear",
    "status": "owned",
    "tags": [],
    "image": "/items/black-flight-jacket.jpg"
  }
]
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS — types match, JSON is valid.

**Step 3: Commit**

```
data: migrate items.json to structured fields (type/color/modifier/brand/status/tags)
```

---

## Task 3: D1 schema migration

**Files:**
- Create: `migrations/003_item_structured_fields.sql`

**Step 1: Write migration SQL**

```sql
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

-- Migrate existing data: parse name into type field (type = full name as fallback)
UPDATE items SET type = name WHERE type = '';
```

Note: The `tags` column stores a JSON array as text. D1/SQLite handles this fine.

**Step 2: Commit (do NOT run migration yet — run after API route is updated)**

```
schema: add structured fields to items table (migration 003)
```

---

## Task 4: Update items API route

**Files:**
- Modify: `app/api/items/route.ts`

**Step 1: Update GET to return new fields**

Replace the SELECT query:

```typescript
const { results } = await db.prepare(
  'SELECT id, name, type, color, modifier, brand, size, notes, category, status, tags, image FROM items ORDER BY name'
).all();

// Parse tags from JSON string
const items = (results as Record<string, unknown>[]).map((row) => ({
  ...row,
  tags: row.tags ? JSON.parse(row.tags as string) : [],
}));
return NextResponse.json(items);
```

For the JSON fallback path, return as-is (items.json already has the new fields).

**Step 2: Update POST to accept new fields**

Replace the POST body type and insert:

```typescript
const body = await request.json() as {
  type?: string;
  color?: string;
  modifier?: string;
  brand?: string;
  size?: string;
  notes?: string;
  category?: string;
  status?: string;
  tags?: string[];
};

const { type, color, modifier, brand, size, notes, category, status, tags } = body;
if (!type || !category) {
  return NextResponse.json({ error: 'type and category required' }, { status: 400 });
}

// Generate display name for ID
const displayName = [color, modifier, type].filter(Boolean).join(' ');
const id = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const name = displayName; // Legacy field
const image = `/items/${id}.jpg`;
const itemStatus = status || 'owned';
const tagsJson = JSON.stringify(tags || []);

await db.prepare(
  `INSERT INTO items (id, name, type, color, modifier, brand, size, notes, category, status, tags, image)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).bind(id, name, type, color || '', modifier || '', brand || '', size || '', notes || '', category, itemStatus, tagsJson, image).run();
```

**Step 3: Add PATCH method for updating items**

Add after the POST function:

```typescript
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { id, ...fields } = body;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const allowed = ['type', 'color', 'modifier', 'brand', 'size', 'notes', 'category', 'status', 'tags', 'image'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!allowed.includes(key)) continue;
      updates.push(`${key} = ?`);
      values.push(key === 'tags' ? JSON.stringify(value) : value);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Also update legacy name field
    const item = await db.prepare('SELECT type, color, modifier FROM items WHERE id = ?').bind(id).first() as Record<string, string> | null;
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const newType = (fields.type as string) || item.type;
    const newColor = (fields.color as string) || item.color;
    const newModifier = (fields.modifier as string) || item.modifier;
    const displayName = [newColor, newModifier, newType].filter(Boolean).join(' ');
    updates.push('name = ?');
    values.push(displayName);

    values.push(id);
    await db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```
feat: expand items API with structured fields, PATCH endpoint
```

---

## Task 5: Run D1 migration

**Step 1: Run migration on remote D1**

```bash
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/003_item_structured_fields.sql
```

**Step 2: Verify by querying**

```bash
npx wrangler d1 execute k5m-fashion-db --remote --command="SELECT id, type, status FROM items LIMIT 3"
```

Expected: Items show with `type` = their old `name` and `status` = `owned`.

---

## Task 6: Upgrade ItemImage with type-based SVG fallbacks

**Files:**
- Modify: `components/ItemImage.tsx`

**Step 1: Replace the placeholder fallback**

Add an SVG icon map by category and update the fallback to use it instead of showing the first letter. Keep the same size system. The SVG icons are simple silhouettes — hat, shirt, pants, shoe, jacket, glasses.

```typescript
const categoryIcons: Record<string, string> = {
  hats: 'M30 55h40v-5c0-8-8-15-20-15s-20 7-20 15v5z M25 55h50',
  tops: 'M35 25l-15 10v20h10v20h40v-20h10v-20l-15-10h-30z',
  bottoms: 'M35 25h30v15l-5 35h-8l-7-35-7 35h-8l-5-35v-15z',
  shoes: 'M25 50h40l5-8h-15v-7h-20v7h-15l5 8z',
  outerwear: 'M32 20l-17 12v25h12v-20h6v20h14v-20h6v20h12v-25l-17-12h-16z',
  accessories: 'M50 30a15 15 0 1 0 0 30 15 15 0 1 0 0-30z M38 45a12 12 0 0 1 24 0',
};
```

In the fallback div, replace the letter with:

```tsx
<svg viewBox="0 0 100 80" fill="none" stroke="var(--color-text)" strokeWidth="2" opacity="0.3"
  style={{ width: '60%', height: '60%' }}>
  <path d={categoryIcons[item.category] || categoryIcons.accessories} />
</svg>
```

Also update it to use `getDisplayName(item)` for the alt text on the real image.

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```
feat: upgrade ItemImage fallback to type-based SVG silhouettes
```

---

## Task 7: Rebuild wardrobe page with three sections

**Files:**
- Modify: `app/items/page.tsx`
- Modify: `app/globals.css`

**Step 1: Add card grid styles to globals.css**

```css
/* Item card grid */
.item-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .item-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Status badge */
.status-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 5px;
  border: 1px solid var(--color-text);
}
```

**Step 2: Rewrite wardrobe page**

The page becomes a server component with three sections. Import `getDisplayName`. Filter items by status. Render:

1. **The Closet** (packed) — warm gradient, card grid with images
2. **The Wardrobe** (owned) — cool gradient, grouped by category, card grid
3. **Wishlist** (wishlist) — lighter section, simpler list

Each item card links to `/items/[id]` and shows: ItemImage, display name, category, brand (muted), tags as chips.

Add a client component at the bottom for the "Show retired" toggle (the only interactive part).

**Step 3: Verify build and visual check**

Run: `npm run build && npm run dev`
Visit `/items` — three sections render, items filtered by status.

**Step 4: Commit**

```
feat: rebuild wardrobe page with Closet/Wardrobe/Wishlist sections
```

---

## Task 8: Update item detail page

**Files:**
- Modify: `app/items/[id]/page.tsx`

**Step 1: Add new fields below item name**

After the display name heading, add:
- Brand (muted, only if present)
- Status badge
- Tags as chips (only if present)
- Notes (only if present)
- Size (muted, only if present)

Use `getDisplayName(item)` instead of `item.name` for the heading.

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```
feat: show brand, status, tags, notes on item detail page
```

---

## Task 9: Expand admin item editor

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Replace the simple name+category form**

The new item form needs fields for: type (required), color, modifier, brand, size, category dropdown, status radio, tags chip input, notes textarea.

Add a live preview of the generated display name above the form.

The item form sends a POST to `/api/items` with the structured fields.

**Step 2: Update existing item display in outfit list**

Where items are displayed in the outfit editor, use `getDisplayName()` instead of `item.name`.

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```
feat: expand admin item editor with structured fields and live name preview
```

---

## Task 10: Add admin photo lightbox

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/globals.css`

**Step 1: Add lightbox CSS**

```css
/* Lightbox overlay */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lightbox-overlay img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}
```

**Step 2: Add lightbox state and component to admin page**

Add `lightboxImage` state. When an outfit thumbnail is clicked, set it. Render a fixed overlay with the full-res image. Close on click or Escape keydown.

**Step 3: Verify**

Run: `npm run dev`
Visit `/admin`, click a photo thumbnail — lightbox opens. Click or Escape — closes.

**Step 4: Commit**

```
feat: add photo lightbox overlay in admin panel
```

---

## Task 11: Add bulk pack action

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Add a "Pack Items" section to admin**

Below the items list, add:
- Checkbox next to each item (when in pack mode)
- "Pack Items" button that toggles pack mode
- "Pack Selected" button that sends PATCH requests for each selected item with `status: 'packed'`
- "Unpack All" button that resets all packed items to `status: 'owned'`

**Step 2: Verify**

Run: `npm run dev`
Visit `/admin`, toggle pack mode, select items, pack them. Visit `/items` — they appear in The Closet.

**Step 3: Commit**

```
feat: add bulk pack/unpack action in admin
```

---

## Task 12: Update remaining pages to use getDisplayName

**Files:**
- Modify: `app/page.tsx` (home page outfit card item tags)
- Modify: `app/stats/page.tsx` (item stat names)
- Modify: `app/my-votes/page.tsx` (if items displayed)
- Modify: `components/OutfitCard.tsx` (item tag labels)

**Step 1: Find all uses of `item.name` and replace with `getDisplayName(item)`**

The OutfitCard component shows item names as photo tags. The stats page shows item names in the rankings table. These should all use `getDisplayName()`.

For client components that import items from JSON directly, add the helper import.

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```
refactor: use getDisplayName() across all pages
```

---

## Task 13: Final verification and CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Full verification**

1. `npm run build` — no TypeScript errors
2. `/items` — three sections render (Closet empty, Wardrobe has 13 items, Wishlist empty, retired toggle shows 2)
3. `/items/black-slim-jeans` — shows structured fields, hero image
4. `/admin` — create new item with just type "Boots", verify display name
5. `/admin` — edit item, add color/modifier, verify name updates
6. `/admin` — click outfit photo, lightbox opens
7. `/admin` — pack items, verify they move to The Closet on `/items`
8. `/stats` — item names display correctly
9. Home page — item tags on outfit cards use display names

**Step 2: Update CLAUDE.md**

Add note about structured item fields, status lifecycle, getDisplayName helper. Update the Data Model section.

**Step 3: Commit**

```
docs: update CLAUDE.md with wardrobe expansion details
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `lib/types.ts` | Expand Item interface |
| `lib/data.ts` | Add `getDisplayName()` helper |
| `data/items.json` | Migrate 15 items to structured fields |
| `migrations/003_item_structured_fields.sql` | **NEW** D1 schema migration |
| `app/api/items/route.ts` | GET returns new fields, POST accepts new fields, new PATCH method |
| `components/ItemImage.tsx` | Type-based SVG fallback icons |
| `app/items/page.tsx` | Three-section wardrobe layout |
| `app/items/[id]/page.tsx` | Show brand, status, tags, notes |
| `app/admin/page.tsx` | Expanded editor, lightbox, bulk pack |
| `app/globals.css` | Card grid, status badge, lightbox styles |
| `app/page.tsx` | Use getDisplayName for item tags |
| `app/stats/page.tsx` | Use getDisplayName for stat names |
| `components/OutfitCard.tsx` | Use getDisplayName for item tags |
| `CLAUDE.md` | Update data model docs |
