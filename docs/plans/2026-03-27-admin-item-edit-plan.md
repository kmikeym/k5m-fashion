# Admin Item Edit UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an inline item editor to the admin page so Mike can click any item in a new "Items" list section, expand an inline form to edit all structured fields, preview the display name live, and save changes via `PATCH /api/items`.

**Architecture:** A new "Items" list section renders below the Pack/Unpack section. Each item row shows its display name, category badge, status badge, and brand. Clicking a row expands an inline editor with text inputs, dropdowns, and a textarea. Save sends a PATCH request; cancel collapses the editor. All state lives in the existing `AdminPage` component — no new files needed.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Cloudflare D1 (via existing PATCH endpoint)

**Design doc:** `docs/plans/2026-03-27-admin-item-edit.md`

---

## Task 1: Add item editor state variables

**File:** `app/admin/page.tsx` (lines 33–50)

**Step 1: Add new state after existing state declarations (after line 50)**

```typescript
const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editItem, setEditItem] = useState<Partial<Item>>({});
```

`editingItemId` tracks which item row is expanded. `editItem` holds the working copy of that item's fields while editing.

**Step 2: Add helper to open the editor**

Add after the `startEdit` function (after line 161):

```typescript
function startEditItem(item: Item) {
  setEditingItemId(item.id);
  setEditItem({
    type: item.type,
    color: item.color || '',
    modifier: item.modifier || '',
    brand: item.brand || '',
    size: item.size || '',
    category: item.category,
    status: item.status,
    tags: item.tags || [],
    notes: item.notes || '',
  });
}
```

**Step 3: Add save handler**

Add after `startEditItem`:

```typescript
async function saveEditItem() {
  if (!editingItemId) return;
  setSaving(true);
  const res = await fetch('/api/items', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: editingItemId, ...editItem }),
  });
  if (res.ok) {
    await refreshItems();
  }
  setEditingItemId(null);
  setEditItem({});
  setSaving(false);
}
```

This reuses the existing `PATCH /api/items` endpoint (`app/api/items/route.ts:71–118`) and `refreshItems()` (`app/admin/page.tsx:105–108`).

**Step 4: Add live display name preview derived value**

Add after `saveEditItem`:

```typescript
const editItemPreview = editingItemId
  ? [editItem.color, editItem.modifier, editItem.type].filter(Boolean).join(' ') || 'Item Name Preview'
  : '';
```

This mirrors the existing `newItemPreview` pattern (line 110) but for the edit form.

**Verification:** `npm run build` — no TypeScript errors.

**Commit:**
```
feat(admin): add state and handlers for inline item editor
```

---

## Task 2: Render the Items list section

**File:** `app/admin/page.tsx`

**Step 1: Add the Items list section after the Pack/Unpack section (after line 456, before the Outfit List comment on line 458)**

Insert a new section between the closing `</div>` of Pack/Unpack and the `{/* Outfit List */}` comment:

```tsx
{/* Items List — click to edit */}
<div className="mb-10" style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '24px' }}>
  <p className="txt-meta font-semibold uppercase mb-3">
    All Items
  </p>

  <div className="flex flex-col">
    {items.map((item) => {
      const isEditingThis = editingItemId === item.id;
      return (
        <div key={item.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
          {/* Item row — click to expand */}
          <div
            className="flex items-center gap-3 py-2 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => isEditingThis ? setEditingItemId(null) : startEditItem(item)}
          >
            {/* Display name */}
            <span className="text-sm font-bold flex-1 truncate">
              {getDisplayName(item)}
            </span>

            {/* Category badge */}
            <span className="status-badge opacity-60">
              {item.category}
            </span>

            {/* Status badge */}
            <span
              className="status-badge"
              style={{
                background: item.status === 'packed' ? 'var(--color-text)' : 'transparent',
                color: item.status === 'packed' ? '#fff' : 'var(--color-text)',
              }}
            >
              {item.status}
            </span>

            {/* Brand (muted) */}
            {item.brand && (
              <span className="txt-meta opacity-40 hidden sm:inline">
                {item.brand}
              </span>
            )}

            {/* Toggle arrow */}
            <span className="txt-meta opacity-30">
              {isEditingThis ? '▲' : '▼'}
            </span>
          </div>

          {/* Inline editor (expanded) — Task 3 renders this */}
          {isEditingThis && (
            <div className="pb-4 pt-2 pl-4">
              {/* Placeholder — replaced in Task 3 */}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
```

The `status-badge` class already exists in `app/globals.css` from the wardrobe expansion.

**Verification:** `npm run build` — PASS. Visit `/admin` — items list appears, clicking expands an empty editor area.

**Commit:**
```
feat(admin): render clickable items list with category and status badges
```

---

## Task 3: Build the inline editor form

**File:** `app/admin/page.tsx`

**Step 1: Replace the placeholder inside the `isEditingThis` block from Task 2 with the full editor form**

```tsx
{isEditingThis && (
  <div className="pb-4 pt-2 pl-4">
    {/* Live name preview */}
    <div className="text-lg font-bold tracking-tight mb-3" style={{ opacity: editItem.type ? 1 : 0.3 }}>
      {editItemPreview}
      {editItem.brand && <span className="txt-meta opacity-40 ml-2">{editItem.brand}</span>}
    </div>

    {/* Row 1: Type + Color + Modifier */}
    <div className="flex gap-2 mb-2">
      <div className="flex-1">
        <label className="txt-meta opacity-50 block mb-1">Type *</label>
        <input
          type="text"
          value={editItem.type || ''}
          onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
          placeholder="Jeans, Hat, Tee..."
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
      <div className="flex-1">
        <label className="txt-meta opacity-50 block mb-1">Color</label>
        <input
          type="text"
          value={editItem.color || ''}
          onChange={(e) => setEditItem({ ...editItem, color: e.target.value })}
          placeholder="Black, Blue..."
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
      <div className="flex-1">
        <label className="txt-meta opacity-50 block mb-1">Modifier</label>
        <input
          type="text"
          value={editItem.modifier || ''}
          onChange={(e) => setEditItem({ ...editItem, modifier: e.target.value })}
          placeholder="Slim, LA Dodgers..."
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
    </div>

    {/* Row 2: Brand + Size + Category + Status */}
    <div className="flex gap-2 items-end mb-2">
      <div>
        <label className="txt-meta opacity-50 block mb-1">Brand</label>
        <input
          type="text"
          value={editItem.brand || ''}
          onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
          placeholder="Carhartt..."
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          style={{ width: 120 }}
        />
      </div>
      <div>
        <label className="txt-meta opacity-50 block mb-1">Size</label>
        <input
          type="text"
          value={editItem.size || ''}
          onChange={(e) => setEditItem({ ...editItem, size: e.target.value })}
          placeholder="M, 32..."
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
          style={{ width: 80 }}
        />
      </div>
      <div>
        <label className="txt-meta opacity-50 block mb-1">Category</label>
        <select
          value={editItem.category || 'tops'}
          onChange={(e) => setEditItem({ ...editItem, category: e.target.value as Item['category'] })}
          className="border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="txt-meta opacity-50 block mb-1">Status</label>
        <select
          value={editItem.status || 'owned'}
          onChange={(e) => setEditItem({ ...editItem, status: e.target.value as Item['status'] })}
          className="border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="owned">owned</option>
          <option value="packed">packed</option>
          <option value="wishlist">wishlist</option>
          <option value="retired">retired</option>
        </select>
      </div>
    </div>

    {/* Row 3: Tags */}
    <div className="mb-2">
      <label className="txt-meta opacity-50 block mb-1">Tags (comma-separated)</label>
      <input
        type="text"
        value={(editItem.tags || []).join(', ')}
        onChange={(e) => setEditItem({
          ...editItem,
          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
        })}
        placeholder="capsule, formal, travel..."
        className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </div>

    {/* Row 4: Notes */}
    <div className="mb-3">
      <label className="txt-meta opacity-50 block mb-1">Notes</label>
      <textarea
        value={editItem.notes || ''}
        onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
        placeholder="Any notes about this item..."
        rows={2}
        className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink resize-y"
      />
    </div>

    {/* Save / Cancel */}
    <div className="flex gap-2">
      <button
        onClick={saveEditItem}
        disabled={saving || !editItem.type?.trim()}
        className="photo-tag cursor-pointer hover:opacity-70 transition-opacity py-2 px-4"
        style={{ fontSize: '12px', opacity: saving ? 0.5 : 1 }}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={() => { setEditingItemId(null); setEditItem({}); }}
        className="txt-meta font-bold uppercase opacity-50 hover:opacity-100 transition-opacity cursor-pointer py-2 px-4"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

The form mirrors the existing "New Item Creator" (lines 259–361) for visual consistency — same input classes, same label pattern, same row layout. Key differences:

- Fields pre-populated from `editItem` state (set by `startEditItem`)
- Tags use comma-separated input with split/join conversion
- Notes get a `<textarea>` instead of a text input
- Live preview uses `editItemPreview` (computed in Task 1, Step 4)
- Save calls `saveEditItem()` which PATCHes instead of POSTs

**Verification:** `npm run build` — PASS. Visit `/admin`, click an item, editor expands with all fields populated.

**Commit:**
```
feat(admin): inline item editor with all fields, live preview, save/cancel
```

---

## Task 4: Final verification

**Step 1: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

**Step 2: Functional checks on `/admin`**

1. Items list visible below Pack/Unpack section — each row shows display name, category badge, status badge, brand
2. Click an item — editor expands with all fields pre-populated
3. Change the color field — live name preview updates immediately
4. Click Save — display name updates in the items list
5. Click Cancel — editor collapses, no changes saved
6. Change status to "packed" — after save, item moves to The Closet on `/items`
7. Add tags (e.g., "capsule, travel") — after save, tags visible on item detail page `/items/[id]`
8. Add notes — after save, notes visible on item detail page
9. Open a different item while one is expanded — first one closes, second opens
10. New item creator still works independently of the item editor

**Step 3: Commit**

```
docs: add admin item edit implementation plan
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `app/admin/page.tsx` | Add state (`editingItemId`, `editItem`), helpers (`startEditItem`, `saveEditItem`, `editItemPreview`), Items list section with inline editor |

## Existing Code Reused

| Code | Location | Usage |
|------|----------|-------|
| `getDisplayName()` | `lib/data.ts:5–9` | Display name in item rows |
| `CATEGORIES` | `app/admin/page.tsx:9` | Category dropdown options |
| `refreshItems()` | `app/admin/page.tsx:105–108` | Reload item list after save |
| `PATCH /api/items` | `app/api/items/route.ts:71–118` | Backend endpoint for saving edits |
| `Item` interface | `lib/types.ts:1–23` | Type for `editItem` state |
| Input styling pattern | `app/admin/page.tsx:268–299` | Same classes as new item form |
| `status-badge` CSS class | `app/globals.css` | Category and status badges |
| `photo-tag` CSS class | `app/globals.css` | Save button styling |
