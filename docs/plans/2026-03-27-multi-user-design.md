# Multi-User Expansion Design

**Date:** 2026-03-27
**Status:** Approved

## Problem

One person's outfits isn't enough content to sustain a voting community. The app needs other people posting fits to generate voting volume — which in turn makes Mike's analytics more valuable.

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Onboarding | Sign in (Clerk), then post | Auth-first for quality. Already have Clerk. |
| Voting scale | Binary +/− buttons, % score display | Keeps speed of binary, removes cruelty of "NOT". Rotten Tomatoes model. |
| Button labels | **+** and **−** (no words) | Universal, no language barrier, fastest tap. |
| User stats | Score only | Deep analytics are Mike's admin feature. Regular users see their % and vote count. |
| Feed model | Everyone's outfits, one stream | Simple, maximum cross-pollination. No social graph. |

---

## Minimum Feature Set (4 changes)

### 1. Replace Hot/Not with +/− and percentage display
- Vote buttons: **+** and **−** (styled, no words)
- After voting: large **"74%"** with fill bar + "34 votes" muted below
- Applies everywhere votes appear (feed, profile, archive)
- Database: no schema change (vote is still 1 or 0 — just relabeled)

### 2. Photo upload for any signed-in user
- Signed-in users get a "Post today's fit" button
- Upload screen: photo + date + optional description
- No item tagging for regular users (admin-only feature)
- Outfits table gets a `user_id` column to track who posted

### 3. Mixed feed of everyone's outfits
- Home page shows all recent outfits from all users
- Single-card voting flow (existing pattern)
- User's own outfits excluded from their feed
- Archive grid shows everyone's recent fits

### 4. User profile page ("My Fits")
- Grid of the user's posted outfits
- Score overlaid on each photo
- No analytics, no item data, no synergy — just the photos and scores

---

## Language System

**Tone:** Casual, fashion-aware, never techy.

| Context | Copy |
|---------|------|
| Tagline | "The daily fit check." |
| Vote buttons | **+** / **−** (icons, no words) |
| Score display | "74%" with fill bar, "34 votes" below |
| Upload button | "Post today's fit" |
| Upload header | "What are you wearing?" |
| Profile header | "Your fits" |
| Empty: no posts | "No fits posted yet. What are you wearing today?" |
| Empty: no votes | "Waiting for votes..." |
| Empty: feed done | "You've voted on everything. Check back tomorrow." |

**Word choices:**
- "fit" not "outfit" (shorter, more current)
- "score" not "rating" (not a review)
- "post" not "upload" (social, not technical)
- No "hot", "not", "rate" anywhere

---

## Navigation (Role-Based)

### Signed-out visitor
- Can browse the feed (read-only)
- Sign-in prompt on vote or post attempt

### Regular user (signed in)
- **Feed** — mixed stream, +/− voting
- **Post** — upload button (header or nav)
- **My Fits** — personal outfit grid with scores

### Mike/Admin (signed in, email match)
- Everything above, plus:
- **Items** — The Wardrobe / The Closet
- **Stats** — analytics dashboard (per-item, pair synergy, drag detection)
- **Admin** — upload, item tagging, lightbox, bulk pack

**Gating:** Same `ADMIN_EMAIL` check already in `Header.tsx`. Admin nav links render conditionally.

---

## Schema Changes

| Table | Change |
|-------|--------|
| `outfits` | Add `user_id TEXT` column (Clerk user ID of poster) |

Existing outfits get `user_id` = admin user ID. Votes table unchanged (vote is still 1 or 0).

---

## Files Changed (estimated)

| File | Change |
|------|--------|
| `components/OutfitCard.tsx` | +/− buttons, % score display |
| `components/Header.tsx` | Role-based nav links |
| `app/page.tsx` | Mixed feed with user exclusion |
| `app/profile/page.tsx` | **NEW** — user's outfit grid with scores |
| `app/post/page.tsx` | **NEW** — upload screen for regular users |
| `app/api/outfits/upload/route.ts` | Accept uploads from any signed-in user |
| `migrations/004_multi_user.sql` | Add `user_id` to outfits |
| `app/globals.css` | Score bar, +/− button styles |

## What Stays the Same

- Item tagging, The Wardrobe, The Closet — admin only
- Stats dashboard — admin only
- Pair synergy, drag detection — admin only
- Clerk auth — already in place
- D1 database — votes table unchanged
