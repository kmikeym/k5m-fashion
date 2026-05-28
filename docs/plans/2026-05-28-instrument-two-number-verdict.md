# Two-Number Verdict + Anonymous Voting — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-architect the outfit screen (#15, revised 2026-05-28) into a two-number "Instrument vs Room" verdict with anonymous (login-free) voting, honoring Seshat's seven laws.

**Architecture:** Add a computed, adaptive **Instrument score** (derived from the fit's items' historical HIT-rates, independent of this fit's live votes) that carries cold-start, shown beside **The Room** (crowd HIT% on a /10 scale). Voting goes login-free against a localStorage device token; Clerk sign-in becomes an after-the-verdict "claim your taste" upgrade with vote-history merge. A D1 migration (005) makes votes voter-type aware and adds an instrument baseline for the "revised" trust marker.

**Tech Stack:** Next.js 15 (edge runtime), Cloudflare Pages + D1, Clerk, TypeScript, Tailwind. New: `node --test` for pure-logic unit tests (no new deps).

---

## Decisions baked in (from #15 + Mike, 2026-05-28)
- Poles are **HIT / MISS** (DB keeps internal `'hot'`/`'not'` values — UI rename only, no data migration for naming).
- Both numbers on a shared **/10 scale**, one decimal (false precision: `8.6`).
- **Law 3:** a user's tap never moves the *displayed* Room average — capture their vote as settled, show the crowd's as already-decided.
- **Law 7:** below the vote floor (`MIN_VOTES = 5`, from `lib/verdict.ts`), grey The Room; the Instrument always shows.
- **Anonymous-first:** vote with no login (localStorage token, cookie fallback); IP is rate-limit only; login offered after the verdict; merge anon history on sign-in.
- The earlier "predictive analysis projection" (current `getVerdict` predictive branch) is **superseded** by the computed Instrument carrying cold-start — remove it from the outfit screen.

## ⚠️ PROPOSED — Instrument score v1 formula (needs Mike/Ogilvy sign-off before Task 1)
THE INSTRUMENT = "a tally of the data the app holds about the fit, presented as an opinion." v1 uses the fit's **items' historical HIT-rates** across the whole catalog (not this fit's room verdict), with Bayesian shrinkage so thin data doesn't swing it:

```
PRIOR_RATE = 0.5      // neutral
PRIOR_W    = 5        // phantom votes of pull toward neutral

for each item i in the fit:
    hits_i, total_i = HIT/total votes across ALL fits containing item i
    rate_i   = (hits_i + PRIOR_W * PRIOR_RATE) / (total_i + PRIOR_W)
    weight_i = total_i + PRIOR_W
instrument_rate  = Σ(rate_i * weight_i) / Σ(weight_i)   // weighted by confidence
                 = PRIOR_RATE if the fit has no items
instrument_score = round(instrument_rate * 10, 1)        // /10, one decimal
```

**Properties:** deterministic; has an opinion at vote #1 (carries cold-start); adaptive (recomputes as the items accrue votes on *other* fits → `7.1` can become `8.6`); independent of this fit's live Room tap (Law 3-safe). **v2 (not now):** fold in tags / category comparables. **Open for Mike:** the prior strength (5) and whether items-only is enough for v1.

---

## Phase 1 — Instrument score (pure logic + tests)

### Task 1: Instrument formula module
**Files:**
- Create: `lib/instrument.ts`
- Test: `lib/instrument.test.ts`

**Step 1: Write the failing test**
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instrumentScore } from './instrument';

test('no items → neutral 5.0', () => {
  assert.equal(instrumentScore([]), 5.0);
});
test('one strong item pulls above neutral but is shrunk toward 5', () => {
  // item with 8 hits / 10 votes → raw 0.8, shrunk = (8+2.5)/(10+5)=0.7 → 7.0
  assert.equal(instrumentScore([{ hits: 8, total: 10 }]), 7.0);
});
test('thin data stays near neutral', () => {
  // 1 hit / 1 vote → (1+2.5)/(1+5)=0.583 → 5.8
  assert.equal(instrumentScore([{ hits: 1, total: 1 }]), 5.8);
});
test('confidence-weights items by vote count', () => {
  // heavily-voted strong item dominates a thin weak one
  const s = instrumentScore([{ hits: 90, total: 100 }, { hits: 0, total: 1 }]);
  assert.ok(s > 7.5 && s <= 9.0);
});
```

**Step 2: Run, expect FAIL** — `node --test lib/instrument.test.ts` → "Cannot find module './instrument'".

**Step 3: Implement**
```ts
// lib/instrument.ts
export const PRIOR_RATE = 0.5;
export const PRIOR_W = 5;

export interface ItemTally { hits: number; total: number; }

/** Computed, adaptive /10 Instrument score from a fit's items' historical HIT-rates. */
export function instrumentScore(items: ItemTally[]): number {
  if (items.length === 0) return round1(PRIOR_RATE * 10);
  let wSum = 0, rwSum = 0;
  for (const { hits, total } of items) {
    const rate = (hits + PRIOR_W * PRIOR_RATE) / (total + PRIOR_W);
    const weight = total + PRIOR_W;
    rwSum += rate * weight;
    wSum += weight;
  }
  return round1((rwSum / wSum) * 10);
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
```

**Step 4: Run, expect PASS** — `node --test lib/instrument.test.ts`.

**Step 5: Commit** — `git add lib/instrument.ts lib/instrument.test.ts && git commit -m "feat: instrument score v1 formula + tests"`

### Task 2: Wire `node --test` into package.json
**Files:** Modify `package.json` (scripts).
- Add `"test": "node --test 'lib/**/*.test.ts'"` (Node 22 runs TS via stripping; if the runner errors on TS syntax, fall back to `"test": "node --experimental-strip-types --test lib/*.test.ts"`).
- **Verify:** `npm test` runs Task 1's tests green. Commit.

---

## Phase 2 — Instrument API + revised-marker baseline

### Task 3: Migration 005a — instrument baseline column
**Files:** Create `migrations/005_instrument_and_anon.sql` (this file also covers Phase 3).
```sql
-- Instrument baseline for the "revised" trust marker
ALTER TABLE outfits ADD COLUMN instrument_baseline REAL;
```
(Backfill happens in Task 5 once the endpoint can compute scores.)
**Do not run against production yet** — see "Migration safety" at the bottom. Run against **staging D1** first.

### Task 4: `/api/instrument` endpoint
**Files:** Create `app/api/instrument/route.ts` (mirror `app/api/stats/route.ts` patterns; `runtime = 'edge'`).
- GET `?outfit_id=…`: load the fit's item ids from `outfit_items`; for each, aggregate `hits/total` from `votes` joined across all fits containing that item; pass to `instrumentScore()`; read `instrument_baseline`; compute `revised = baseline != null && Math.abs(score - baseline) >= 0.1`.
- Return `{ score, baseline, revised, asOf }` (`asOf` = today's date when revised).
- **Verify:** `npx wrangler pages dev` (apply the esbuild fix from `DEPLOY.md` if needed) bound to staging D1; `curl localhost:8788/api/instrument?outfit_id=pxl-20250901` returns a score. Commit.

### Task 5: Baseline backfill (one-time, staging then prod)
**Files:** none (operational).
- For each outfit with `instrument_baseline IS NULL`, compute current score and write it: `UPDATE outfits SET instrument_baseline = ? WHERE id = ?`.
- Implement as a tiny admin-only route `app/api/instrument/backfill/route.ts` (POST, Clerk-admin gated) or a `wrangler d1 execute` script. Run on **staging D1** first, verify, defer prod to Phase 5.

---

## Phase 3 — Anonymous-vote backend

### Task 6: Migration 005b — voter type
**Files:** append to `migrations/005_instrument_and_anon.sql`.
```sql
-- Anonymous voting: user_id now holds either a Clerk id or an anon device token.
ALTER TABLE votes ADD COLUMN voter_type TEXT NOT NULL DEFAULT 'user'; -- 'user' | 'anon'
-- Existing rows are real users; default covers them. UNIQUE(outfit_id, user_id) still dedups.
```

### Task 7: `/api/vote` accepts anonymous votes
**Files:** Modify `app/api/vote/route.ts`.
- Drop the hard `401` when no `userId`. Resolve voter: `userId` (Clerk) → `voter_type='user'`; else read `token` from the request body → `voter_type='anon'`; if neither, `400`.
- Rate-limit anon by IP using `request.headers.get('cf-connecting-ip')` (best-effort cap, e.g. 30 votes/min/ip) — **IP is never the identity**, only an abuse signal.
- INSERT `(outfit_id, user_id=voter, vote, voter_type)`; keep the `UNIQUE` → `409` path.
- **Verify (local wrangler pages dev + staging D1):** curl a vote with `{outfit_id, vote, token:"test-uuid"}` and no auth → 200; repeat → 409. Commit.

### Task 8: `/api/votes` "my vote" by token
**Files:** Modify `app/api/votes/route.ts`.
- The single-outfit tally branch: when no Clerk `userId`, accept a `token` query param and resolve `myVote` from it.
- **Verify:** curl `?outfit_id=…&token=test-uuid` returns the prior vote. Commit.

### Task 9: Merge-on-login endpoint
**Files:** Create `app/api/votes/merge/route.ts` (POST, Clerk-gated).
- Body `{ token }`. For each anon vote under `token`: if the user has no vote on that outfit, `UPDATE votes SET user_id=?clerkId, voter_type='user' WHERE outfit_id=? AND user_id=?token`; if a conflict exists (user already voted), `DELETE` the anon row. Wrap in a batch.
- **Verify:** seed an anon vote, sign in, call merge, confirm the row is reassigned and dedup holds. Commit.

---

## Phase 4 — Frontend verdict rebuild

### Task 10: Device-token hook
**Files:** Create `lib/useDeviceToken.ts` (client hook).
- On mount, read `localStorage['ff_token']`; if absent, `crypto.randomUUID()` and persist (cookie fallback when localStorage throws — IG webview). Return the token.
- Commit.

### Task 11: Rebuild `OutfitInstrument` — HIT/MISS, dual readout, gap, Law 3, press-fill
**Files:** Modify `components/OutfitInstrument.tsx`; fetch from `/api/instrument` + `/api/votes`.
- Replace HOT/NOT with **HIT / MISS**; prompt "Hit or miss?".
- **Press-fill (Law 1):** on `pointerdown` the tapped pole/panel starts filling; the tap (`pointerup`/click) commits.
- **Withhold + reveal (Law 2):** dam ~600–900ms, then count-up both numbers.
- **Dual readout (Laws 4/5):** `THE INSTRUMENT 8.6` and `THE ROOM 6.4 (64% HIT · n=38)` positioned on a shared /10 spectrum; **the gap line** names the disagreement.
- **Law 3:** display the Room average as returned *before* adding the user's tap — do **not** optimistically increment the shown average (remove the current `setHot/setNot` increment-then-show).
- **Law 7:** below `MIN_VOTES`, Room reads `NOT ENOUGH DATA · n=4`; Instrument still shows.
- **Color is the reading (Law 6):** `--grad-warm` if Room is a hit, `--grad-cool` if miss.
- **Revised marker:** if `/api/instrument` says `revised`, show a small "revised · as of …" affordance on the Instrument readout, distinct from the stamp-bar post date.
- Vote via `/api/vote` with the device token; no login in the path.
- **Verify:** local wrangler pages dev — tap lands the dual bloom; the shown Room average does not include your own just-cast vote. Commit.

### Task 12: Login-after-verdict + merge
**Files:** Modify `components/OutfitInstrument.tsx` (post-verdict block).
- After the bloom, show a low-key Clerk `SignInButton` framed "claim your taste." On successful sign-in, POST the device token to `/api/votes/merge`.
- **Verify:** vote anon → verdict → sign in → votes merge (check `/api/votes?mine=true`). Commit.

### Task 13: Retire the predictive branch on the outfit screen
**Files:** Modify `lib/verdict.ts` consumers on the outfit screen (the Instrument now carries cold-start). Keep `getVerdict`'s `real`/`empty` states + `MIN_VOTES`; remove the `predictive` projection from the outfit verdict path (stats page already honest). Commit.

---

## Phase 5 — Ship + reconcile

### Task 14: Production migration + backfill
- Run `migrations/005_instrument_and_anon.sql` against **production D1** (`a61d4250`) only after staging verification. Then run the baseline backfill (Task 5) against production.
- **Migration safety:** D1 `ALTER TABLE ADD COLUMN` is additive/non-destructive; existing rows keep working (`voter_type` defaults to `'user'`). No data loss path. Take a `wrangler d1 export` snapshot first.

### Task 15: Docs + issues + deploy
- Update `Fully Fashioned.md` (the 2026-05-27 "keep the Clerk gate" decision is reversed → anonymous-first) and `DEPLOY.md` if schema notes need it.
- Close #15 after the authenticated + anonymous flows verify on mobile in the **Instagram in-app browser** (the #15 acceptance gate). Close #14 (foundation shipped).
- Merge to `master`, deploy to `fashion.quarterly.systems`, verify the dual-number bloom live.

---

## Verification strategy (no full test harness in repo)
- **Pure logic** (`lib/instrument.ts`, `lib/verdict.ts`): `node --test` unit tests (Tasks 1–2).
- **API + D1**: local `npx wrangler pages dev` bound to **staging D1** (`DEPLOY.md` esbuild fix), curl each endpoint. Never test-write against production D1.
- **UI + funnel**: Playwright at mobile width against the deployed staging-equivalent; the binding #15 acceptance is Mike's manual run in the IG in-app browser.
