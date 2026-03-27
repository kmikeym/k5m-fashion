# Admin Item Edit UI

## Context

The wardrobe expansion added structured item fields (type/color/modifier/brand/size/status/tags/notes) and a PATCH API endpoint (`PATCH /api/items`), but no UI to edit existing items. Mike needs to click an item in admin and update its fields inline.

## Approach

Add an inline item editor to the admin page, following the same pattern already used for outfit field editing (click to edit, save on Enter/blur).

### Task: Add inline item editor to admin page

**File:** `app/admin/page.tsx`

1. Add an "Items" list section below the Pack/Unpack section showing all items
2. Each item row: display name, category badge, status badge, brand (muted)
3. Click an item to expand an inline editor with fields:
   - Type, Color, Modifier (text inputs — live name preview)
   - Brand, Size (text inputs)
   - Category (dropdown), Status (dropdown)
   - Tags (comma-separated input)
   - Notes (textarea)
4. Save button sends `PATCH /api/items` with `{ id, ...changedFields }`
5. Cancel collapses the editor

### Reuse existing code
- `getDisplayName()` from `lib/data.ts` — already imported in admin page
- `PATCH /api/items` endpoint — already built in `app/api/items/route.ts`
- Inline edit pattern from outfit description/date/location editing — same page
- `CATEGORIES` constant — already defined at top of admin page
- `refreshItems()` function — already exists for reloading item list after changes

## Verification
1. `npm run build` — no TypeScript errors
2. `/admin` — items list visible, click an item, editor expands
3. Change a field (e.g., color), save — display name updates in the list
4. Change status to "packed" — item moves to The Closet on `/items`
5. Add tags, save — visible on item detail page `/items/[id]`
