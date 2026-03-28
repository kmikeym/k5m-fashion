# Multi-User Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open the app to multiple users: replace Hot/Not with +/− voting and percentage scores, let any signed-in user post fits, show a mixed feed excluding your own, and add a "My Fits" profile page.

**Architecture:** The `outfits` table gains a `user_id` column (Clerk user ID). Existing outfits are backfilled with the admin's user ID. The feed queries D1 for all outfits, filtering out the current user's. Vote buttons become +/− icons with a percentage score display (Rotten Tomatoes model). A new `/profile` page shows the user's own fits with scores. Navigation becomes role-based: admin sees Items/Stats/Admin, regular users see Feed/Post/My Fits.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare D1 (SQLite), Clerk auth, Tailwind CSS, Edge Runtime

**Design doc:** `docs/plans/2026-03-27-multi-user-design.md`

---

## Task 1: D1 migration — add user_id to outfits

**Files:**
- Create: `migrations/004_multi_user.sql`

**Step 1: Write migration SQL**

```sql
-- Multi-user expansion: add user_id to outfits
-- Run: npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/004_multi_user.sql

-- Add user_id column to outfits (nullable for backward compat, then backfill)
ALTER TABLE outfits ADD COLUMN user_id TEXT DEFAULT '';

-- Backfill existing outfits with admin's Clerk user ID
-- Replace with actual admin user ID from Clerk dashboard
UPDATE outfits SET user_id = 'ADMIN_CLERK_USER_ID' WHERE user_id = '';

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id);
```

**Step 2: Look up the admin Clerk user ID**

The admin email is `kmikeym@kmikeym.com` (from `NEXT_PUBLIC_ADMIN_EMAIL` in the codebase). The Clerk user ID for this user needs to be found in the Clerk dashboard or by logging `user.id` in the app. Replace `ADMIN_CLERK_USER_ID` in the SQL before running.

**Step 3: Commit (do NOT run migration yet)**

```
schema: add user_id column to outfits table (migration 004)
```

---

## Task 2: Update Outfit type with user_id

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add user_id to Outfit interface**

In `lib/types.ts`, add `user_id` to the `Outfit` interface:

```typescript
export interface Outfit {
  id: string;
  date: string;
  image: string;
  description: string;
  items: string[]; // item IDs
  location?: string;
  user_id?: string; // Clerk user ID of poster (optional for JSON compat)
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS — the field is optional so existing JSON data still works.

**Step 3: Commit**

```
feat: add user_id field to Outfit type
```

---

## Task 3: Replace Hot/Not buttons with +/− and percentage score

**Files:**
- Modify: `components/OutfitCard.tsx`
- Modify: `app/globals.css`

This is the biggest UI change. The vote buttons become `+` and `−` icons. After voting, a large percentage with a fill bar replaces the buttons.

**Step 1: Add +/− button and score bar styles to globals.css**

Add after the existing `.vote-action-btn` styles:

```css
/* +/− vote buttons */
.vote-btn-row {
  display: flex;
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
  position: relative;
  z-index: 10;
}

.vote-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-primary);
  font-size: 32px;
  font-weight: 300;
  transition: background-color 0.15s;
}

.vote-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.vote-btn:first-child {
  border-right: 1px solid var(--color-text);
}

/* Score display after voting */
.score-display {
  padding: 24px var(--pad);
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
  position: relative;
  z-index: 10;
}

.score-pct {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.score-bar {
  height: 6px;
  width: 100%;
  background: rgba(0, 0, 0, 0.08);
  margin-top: 8px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  background: var(--color-text);
  transition: width 0.5s ease;
}
```

**Step 2: Replace vote buttons in OutfitCard.tsx**

Replace the entire vote buttons section (the `{/* Vote buttons */}` block, approximately lines 175–232) with:

```tsx
{/* Vote buttons */}
{!isLoaded ? null : showVoting && !isSignedIn ? (
  <div
    className="relative z-10 text-center"
    style={{
      padding: '20px var(--pad)',
      borderTop: '1px solid var(--color-text)',
      borderBottom: '1px solid var(--color-text)',
    }}
  >
    <SignInButton mode="modal">
      <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
        Sign in to vote
      </button>
    </SignInButton>
  </div>
) : showVoting && !voted ? (
  <div className="vote-btn-row">
    <button
      onClick={() => vote('not')}
      disabled={loading}
      className="vote-btn"
      aria-label="Vote down"
    >
      −
    </button>
    <button
      onClick={() => vote('hot')}
      disabled={loading}
      className="vote-btn"
      aria-label="Vote up"
    >
      +
    </button>
  </div>
) : showVoting && voted ? (
  <div className="score-display">
    <div className="flex items-baseline gap-2">
      <span className="score-pct">{hotPct !== null ? `${hotPct}%` : '—'}</span>
    </div>
    <div className="score-bar">
      <div className="score-bar-fill" style={{ width: `${hotPct || 0}%` }} />
    </div>
    <p className="txt-meta opacity-50 mt-2">
      {total} vote{total !== 1 ? 's' : ''}
    </p>
  </div>
) : null}
```

**Step 3: Update the existing results bar**

Remove the old vote results bar block (the `{/* Vote results bar */}` section, approximately lines 147–164) — it's now replaced by the score display above.

**Step 4: Update the score badge on the photo**

Replace the score badge text from `{hotPct}% Hot` to just `{hotPct}%`:

```tsx
{/* Score badge */}
{hotPct !== null && (
  <div className="absolute top-3 right-3 bg-white/90 px-2 py-1">
    <span className="txt-meta font-bold">{hotPct}%</span>
  </div>
)}
```

**Step 5: Verify build and visual check**

Run: `npm run build && npm run dev`
Visit `/` — vote buttons should show `−` and `+`. After voting, large percentage with fill bar appears.

**Step 6: Commit**

```
feat: replace Hot/Not with +/− buttons and percentage score display
```

---

## Task 4: Update archive grid and My Votes with new language

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/my-votes/page.tsx`

**Step 1: Update archive grid in app/page.tsx**

In the archive grid section (approximately line 154), change label:

```tsx
<p className="txt-meta font-semibold uppercase opacity-60">
  All Fits &middot; {totalOutfits} total
</p>
```

Change the "All Rated" empty state (approximately lines 123–129) to use new language:

```tsx
<h2 className="txt-display-outline">All</h2>
<h3 className="txt-display-solid">Voted</h3>
<p className="txt-meta opacity-50 mt-4">
  {totalRated} fits voted on &middot;{' '}
  <Link href="/stats" className="underline hover:opacity-70">Check the stats</Link>
</p>
```

In the archive grid, replace the vote badge (approximately lines 205–219) that shows "hot"/"not" text with `+`/`−`:

```tsx
{vote && (
  <div
    className="absolute bottom-1 right-1 px-1.5 py-0.5"
    style={{
      background: vote === 'hot' ? 'var(--color-text)' : 'rgba(255,255,255,0.85)',
      color: vote === 'hot' ? '#fff' : 'var(--color-text)',
      fontSize: '10px',
      fontWeight: 700,
    }}
  >
    {vote === 'hot' ? '+' : '−'}
  </div>
)}
```

**Step 2: Update my-votes/page.tsx**

Replace the summary labels (approximately lines 82–94). Change "Hot" to "+" and "Not" to "−":

```tsx
<div className="flex gap-8 mb-12">
  <div>
    <span className="metric-val">{myVotes.length}</span>
    <p className="txt-meta font-semibold uppercase mt-1">Total</p>
  </div>
  <div>
    <span className="metric-val">{hotVotes}</span>
    <p className="txt-meta font-semibold uppercase mt-1">+</p>
  </div>
  <div>
    <span className="metric-val outline">{notVotes}</span>
    <p className="txt-meta font-semibold uppercase mt-1">−</p>
  </div>
</div>
```

Replace the vote badge in the grid (approximately line 139) from `{v.vote}` to:

```tsx
{v.vote === 'hot' ? '+' : '−'}
```

Update the empty state text (approximately line 73) from "Go rate some outfits" to:

```tsx
<Link href="/" className="underline hover:opacity-70">
  Go vote on some fits
</Link>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS — no "hot", "not", "rate", or "outfit" language visible to users.

**Step 4: Commit**

```
feat: update language — fits not outfits, +/− not hot/not, score not rating
```

---

## Task 5: Open photo upload to any signed-in user

**Files:**
- Modify: `app/api/outfits/upload/route.ts`
- Create: `app/post/page.tsx`

**Step 1: Update upload API to accept user_id**

Modify `app/api/outfits/upload/route.ts` to require auth and save the poster's user_id:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to post' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const description = (formData.get('description') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${dateStr}-${timestamp}.${ext}`;
    const id = `${dateStr}-${timestamp}`;

    // Save metadata to D1 with user_id
    await db.prepare(
      'INSERT INTO outfits (id, date, image, description, location, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, dateStr, `/outfits/${filename}`, description, '', userId).run();

    // TODO: R2 integration for production image uploads
    return NextResponse.json({
      id,
      date: dateStr,
      image: `/outfits/${filename}`,
      description,
      items: [],
      location: '',
      user_id: userId,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Create the Post page**

Create `app/post/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function PostPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', description);

      const res = await fetch('/api/outfits/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      // Redirect to home feed after posting
      router.push('/');
    } catch {
      setError('Something went wrong');
      setUploading(false);
    }
  }

  if (!isLoaded) return null;

  return (
    <section
      className="relative z-10 w-full"
      style={{ borderTop: '1px solid var(--color-text)' }}
    >
      <div
        className="max-w-3xl mx-auto w-full"
        style={{ padding: '64px var(--pad)' }}
      >
        <div className="mb-12">
          <p className="txt-meta mb-4">New Post</p>
          <h2 className="txt-display-outline">What are</h2>
          <h3 className="txt-display-solid">you wearing?</h3>
        </div>

        {!isSignedIn ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-4">Sign in to post your fit</p>
            <SignInButton mode="modal">
              <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Photo picker */}
            <div className="mb-8">
              {preview ? (
                <div className="fit-photo-container" style={{ maxWidth: 400 }}>
                  <img src={preview} alt="Preview" />
                </div>
              ) : (
                <label
                  className="block border border-dashed border-ink/30 p-12 text-center cursor-pointer hover:bg-ink/5 transition-colors"
                  style={{ aspectRatio: '3/4', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="txt-meta opacity-50">Tap to add photo</span>
                </label>
              )}
              {preview && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="txt-meta opacity-50 hover:opacity-100 mt-2 cursor-pointer"
                >
                  Change photo
                </button>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="txt-meta font-semibold uppercase block mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the vibe?"
                className="w-full bg-transparent border-b border-ink/30 py-2 text-sm focus:outline-none focus:border-ink"
                style={{ fontFamily: 'var(--font-primary)' }}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="txt-meta text-red-600 mb-4">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!file || uploading}
              className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                padding: '16px 32px',
                border: '1px solid var(--color-text)',
              }}
            >
              {uploading ? 'Posting...' : 'Post today\'s fit'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```
feat: open photo upload to any signed-in user, add /post page
```

---

## Task 6: Create API route to fetch outfits from D1

**Files:**
- Create: `app/api/outfits/route.ts`

The home page currently reads from `data/outfits.json`. For multi-user, the feed needs to come from D1 (which has `user_id`). Create a GET endpoint that returns outfits from D1 with user exclusion.

**Step 1: Create the outfits API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const excludeOwn = searchParams.get('exclude_own') === 'true';
  const userOnly = searchParams.get('user_id');

  const { userId } = await auth();
  const db = await getD1();

  if (!db) {
    // Fallback: return empty array (JSON data doesn't have user_id)
    return NextResponse.json([]);
  }

  let query = 'SELECT id, date, image, description, location, user_id FROM outfits';
  const params: string[] = [];

  if (userOnly) {
    // Fetch a specific user's outfits
    query += ' WHERE user_id = ?';
    params.push(userOnly);
  } else if (excludeOwn && userId) {
    // Feed mode: exclude current user's outfits
    query += ' WHERE user_id != ?';
    params.push(userId);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const { results } = await db.prepare(query).bind(...params).all();

  // Attach items from outfit_items join
  const outfits = await Promise.all(
    (results as Record<string, unknown>[]).map(async (row) => {
      const { results: itemRows } = await db.prepare(
        'SELECT item_id FROM outfit_items WHERE outfit_id = ?'
      ).bind(row.id).all();
      return {
        ...row,
        items: itemRows.map((r) => r.item_id as string),
      };
    })
  );

  return NextResponse.json(outfits);
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```
feat: add /api/outfits endpoint with user filtering
```

---

## Task 7: Update home page for mixed feed with user exclusion

**Files:**
- Modify: `app/page.tsx`

The home page currently imports outfits from JSON. Change it to fetch from `/api/outfits?exclude_own=true` so users don't see their own fits in the feed.

**Step 1: Replace JSON import with API fetch**

Remove the JSON import lines:

```typescript
// REMOVE these lines:
// import outfitsData from '@/data/outfits.json';
// const allOutfits = (outfitsData as Outfit[]).sort(...)
```

Add outfit fetching to the existing `refresh` callback. Add state for all outfits:

```typescript
const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);

const refresh = useCallback(() => {
  setFetchError(false);

  // Fetch outfits from D1 (exclude own if signed in)
  const outfitUrl = isSignedIn ? '/api/outfits?exclude_own=true' : '/api/outfits';
  fetch(outfitUrl)
    .then((r) => r.json())
    .then((data) => {
      const outfits = (data as Outfit[]).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAllOutfits(outfits);

      // After fetching outfits, set queue based on voted state
      if (isSignedIn) {
        // User's votes will be fetched separately below
      } else {
        setQueue(outfits);
      }
    })
    .catch(() => setFetchError(true));

  // Fetch all tallies
  fetch('/api/votes')
    .then((r) => r.json())
    .then((data) => setTallies(data as Record<string, { hot: number; not: number }>))
    .catch(() => setFetchError(true));

  // Fetch user's votes if signed in
  if (isSignedIn) {
    fetch('/api/votes?mine=true')
      .then((r) => r.json())
      .then((data) => data as { outfit_id: string; vote: 'hot' | 'not' }[])
      .then((records) => {
        const voted = new Set<string>();
        const voteMap: Record<string, 'hot' | 'not'> = {};
        for (const r of records) {
          voted.add(r.outfit_id);
          voteMap[r.outfit_id] = r.vote;
        }
        setVotedIds(voted);
        setMyVotes(voteMap);
      })
      .catch(() => setFetchError(true));
  }
}, [isSignedIn]);
```

**Important:** The queue needs to be set after BOTH outfits and votes are fetched. Use a `useEffect` that depends on `allOutfits` and `votedIds`:

```typescript
useEffect(() => {
  if (isSignedIn) {
    setQueue(allOutfits.filter((o) => !votedIds.has(o.id)));
  } else {
    setQueue(allOutfits);
  }
}, [allOutfits, votedIds, isSignedIn]);
```

**Step 2: Update archive grid label**

The archive grid still needs to show ALL outfits (including own) for browsing. Fetch a separate list for the archive, or just use `/api/outfits` without exclusion. The simplest approach: fetch all outfits for the archive grid separately:

```typescript
const [archiveOutfits, setArchiveOutfits] = useState<Outfit[]>([]);

// In refresh:
fetch('/api/outfits')
  .then((r) => r.json())
  .then((data) => {
    setArchiveOutfits((data as Outfit[]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  })
  .catch(() => {});
```

Use `archiveOutfits` for the bottom grid and `allOutfits` (which excludes own) for the voting queue.

**Step 3: Keep JSON fallback for items**

The items JSON import stays — items are admin-only and won't change in this task:

```typescript
import itemsData from '@/data/items.json';
const allItems = itemsData as Item[];
```

**Step 4: Verify build and visual check**

Run: `npm run build && npm run dev`
- Signed out: see all fits
- Signed in: own fits excluded from voting queue, visible in archive grid

**Step 5: Commit**

```
feat: mixed feed from D1, exclude own fits from voting queue
```

---

## Task 8: Role-based navigation

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Rewrite nav links with role-based rendering**

The design doc specifies:
- **Signed out**: Feed only (read-only browsing)
- **Regular user**: Feed, Post, My Fits
- **Admin**: Feed, Post, My Fits, Items, Stats, Admin

Replace the nav section (approximately lines 39–58):

```tsx
<nav className="flex gap-4 mt-1 items-center">
  <Link href="/" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
    Feed
  </Link>
  <SignedIn>
    <Link href="/post" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
      Post
    </Link>
    <Link href="/profile" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
      My Fits
    </Link>
    <Link href="/my-votes" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
      My Votes
    </Link>
  </SignedIn>
  {isAdmin && (
    <>
      <Link href="/items" className="txt-meta opacity-30 hover:opacity-100 transition-opacity">
        Items
      </Link>
      <Link href="/stats" className="txt-meta opacity-30 hover:opacity-100 transition-opacity">
        Stats
      </Link>
      <Link href="/admin" className="txt-meta opacity-30 hover:opacity-100 transition-opacity">
        Admin
      </Link>
    </>
  )}
</nav>
```

**Step 2: Update site name**

Change the header text from "Mike's Wardrobe" to something more communal. The design doc says "The daily fit check." as the tagline — use the app name as the header link:

```tsx
<Link href="/" className="txt-meta hover:opacity-70 transition-opacity">
  Fully Fashioned
</Link>
```

**Step 3: Update circular stamp text**

Change from "Fully Fashioned • Cast Vote •" to "Fully Fashioned • The Daily Fit Check •":

```tsx
<textPath href="#circlePath" startOffset="0%">
  Fully Fashioned &bull; The Daily Fit Check &bull;
</textPath>
```

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```
feat: role-based navigation — Feed/Post/My Fits for users, Items/Stats/Admin for admin
```

---

## Task 9: Create user profile page ("My Fits")

**Files:**
- Create: `app/profile/page.tsx`

**Step 1: Create the profile page**

This page shows the signed-in user's outfits in a grid with scores overlaid.

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import type { Outfit } from '@/lib/types';

export default function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [tallies, setTallies] = useState<Record<string, { hot: number; not: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setLoading(false);
      return;
    }

    // Fetch this user's outfits
    fetch(`/api/outfits?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setOutfits(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch all tallies for scores
    fetch('/api/votes')
      .then((r) => r.json())
      .then((data) => setTallies(data as Record<string, { hot: number; not: number }>))
      .catch(() => {});
  }, [isSignedIn, user]);

  if (!isLoaded) return null;

  return (
    <section
      className="relative z-10 w-full"
      style={{
        background: 'var(--grad-cool)',
        borderTop: '1px solid var(--color-text)',
      }}
    >
      <div
        className="max-w-3xl mx-auto w-full"
        style={{ padding: '64px var(--pad)' }}
      >
        <div className="mb-12">
          <p className="txt-meta mb-4">Your Closet</p>
          <h2 className="txt-display-outline">Your</h2>
          <h3 className="txt-display-solid">Fits</h3>
        </div>

        {!isSignedIn ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-4">Sign in to see your fits</p>
            <SignInButton mode="modal">
              <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : loading ? (
          <p className="txt-meta opacity-50">Loading...</p>
        ) : outfits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-2">
              No fits posted yet. What are you wearing today?
            </p>
            <Link
              href="/post"
              className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity underline"
            >
              Post your first fit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {outfits.map((outfit) => {
              const tally = tallies[outfit.id];
              const total = tally ? tally.hot + tally.not : 0;
              const pct = total > 0 ? Math.round((tally.hot / total) * 100) : null;

              return (
                <Link
                  key={outfit.id}
                  href={`/outfits/${outfit.id}`}
                  className="relative group"
                >
                  <div className="aspect-[3/4] overflow-hidden border border-ink/10">
                    <img
                      src={outfit.image}
                      alt={outfit.description || 'Fit'}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const parent = img.parentElement;
                        if (parent) {
                          img.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'outfit-img-fallback';
                          const label = document.createElement('span');
                          label.className = 'txt-meta font-bold';
                          label.textContent = new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          fallback.appendChild(label);
                          parent.insertBefore(fallback, parent.firstChild);
                        }
                      }}
                    />
                    {/* Score badge */}
                    {pct !== null ? (
                      <div
                        className="absolute top-1 right-1 px-1.5 py-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {pct}%
                      </div>
                    ) : (
                      <div
                        className="absolute top-1 right-1 px-1.5 py-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          fontSize: '8px',
                          fontWeight: 500,
                          opacity: 0.6,
                        }}
                      >
                        Waiting for votes...
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```
feat: add /profile page — user's fit grid with percentage scores
```

---

## Task 10: Run D1 migration

**Step 1: Get admin Clerk user ID**

Before running, determine the admin's Clerk user ID. If unknown, add a temporary `console.log(userId)` in any auth'd API route, sign in as admin, and check the Cloudflare worker logs. Then update `004_multi_user.sql` with the real ID.

**Step 2: Run migration on remote D1**

```bash
npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/004_multi_user.sql
```

**Step 3: Verify by querying**

```bash
npx wrangler d1 execute k5m-fashion-db --remote --command="SELECT id, user_id FROM outfits LIMIT 5"
```

Expected: All existing outfits show the admin's Clerk user ID.

---

## Task 11: Final verification and CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Full verification checklist**

1. `npm run build` — no TypeScript errors
2. Visit `/` signed out — see all fits, sign-in prompt on vote attempt
3. Visit `/` signed in as admin — own fits excluded from voting queue, archive shows all
4. Vote on a fit — `−` and `+` buttons appear, after voting shows percentage + fill bar
5. Visit `/post` — upload form, post a fit with description
6. Visit `/profile` — own fits appear in grid with scores
7. Visit `/my-votes` — vote history with `+`/`−` badges, no "hot"/"not" text
8. Check header nav:
   - Signed out: only "Feed" link
   - Regular user: Feed, Post, My Fits, My Votes
   - Admin: Feed, Post, My Fits, My Votes, Items, Stats, Admin
9. Archive grid — scores show as `XX%`, vote badges show `+`/`−`
10. No instances of "hot", "not", "rate", "outfit" in user-facing text (code variable names are fine)

**Step 2: Grep for stale language**

```bash
grep -rn '"hot"' components/ app/ --include="*.tsx" | grep -v "=== 'hot'" | grep -v "vote ==" | grep -v "CASE WHEN"
grep -rn '"not"' components/ app/ --include="*.tsx" | grep -v "=== 'not'" | grep -v "vote ==" | grep -v "CASE WHEN"
grep -rn 'Hot' components/ app/ --include="*.tsx"
grep -rn 'Not' components/ app/ --include="*.tsx" | grep -v "SignInButton" | grep -v "// " | grep -v "not_count"
```

Any user-visible instances of "Hot", "Not", "rate", or "outfit" (noun form) should be fixed.

**Step 3: Update CLAUDE.md**

Add to the Data Model section:
- Outfits table now has `user_id` column (Clerk user ID of poster)
- Existing outfits are backfilled with admin user ID

Add to the App Features section:
- Multi-user: any signed-in user can post fits
- Feed excludes own outfits, shows everyone else's
- +/− voting with percentage score display
- /profile page shows user's own fits with scores

Update the API Routes section:
- `GET /api/outfits` — returns outfits from D1 with `?exclude_own=true` and `?user_id=X` filters
- `POST /api/outfits/upload` — now requires auth, saves `user_id`

Add migration note:
- `npx wrangler d1 execute k5m-fashion-db --remote --file=migrations/004_multi_user.sql`

**Step 4: Commit**

```
docs: update CLAUDE.md with multi-user expansion details
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `migrations/004_multi_user.sql` | **NEW** — Add `user_id` to outfits, backfill admin ID |
| `lib/types.ts` | Add `user_id` to Outfit interface |
| `components/OutfitCard.tsx` | Replace Hot/Not with +/− buttons, percentage score display |
| `app/globals.css` | Add +/− button styles, score display styles |
| `app/page.tsx` | Fetch from D1 API, exclude own fits, update language |
| `app/my-votes/page.tsx` | Replace "hot"/"not" with +/−, update language |
| `app/api/outfits/upload/route.ts` | Require auth, save user_id |
| `app/post/page.tsx` | **NEW** — Upload page for any signed-in user |
| `app/api/outfits/route.ts` | **NEW** — GET endpoint with user filtering |
| `components/Header.tsx` | Role-based nav: Feed/Post/My Fits for users, admin extras |
| `app/profile/page.tsx` | **NEW** — User's fit grid with percentage scores |
| `CLAUDE.md` | Update with multi-user architecture and new routes |

## Language Audit Checklist

After all tasks, confirm zero user-visible instances of:

| Old | New |
|-----|-----|
| "Hot" / "Not" (vote labels) | `+` / `−` |
| "Hot or Not" | removed |
| "XX% Hot" | "XX%" |
| "outfit" (user-facing noun) | "fit" |
| "rate" / "rated" | "vote" / "voted" |
| "rating" | "score" |
| "upload" (user-facing) | "post" |

Code variable names like `hotCount`, `hotPct`, `vote === 'hot'` are fine — they're internal. The database column `vote` still stores `'hot'`/`'not'` values — no schema change needed.
