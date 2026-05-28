import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

// Merge an anonymous device token's vote history into the signed-in account
// (Clerk guest -> user). Called once, right after the "claim your taste" sign-in.
// Where the user already voted on an outfit, the existing user vote wins and the
// anon duplicate is dropped (UNIQUE(outfit_id, user_id) would otherwise collide).
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { token } = (await request.json()) as { token?: string };
    if (!token || !token.trim()) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }
    const tok = token.trim();
    if (tok === userId) {
      return NextResponse.json({ merged: 0, dropped: 0 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Anon votes cast under this device token.
    const { results: anonVotes } = await db
      .prepare(
        "SELECT outfit_id FROM votes WHERE user_id = ? AND voter_type = 'anon'"
      )
      .bind(tok)
      .all();

    // Outfits the user has already voted on (their vote wins on conflict).
    const { results: userVotes } = await db
      .prepare('SELECT outfit_id FROM votes WHERE user_id = ?')
      .bind(userId)
      .all();
    const userOutfits = new Set(userVotes.map((r) => r.outfit_id as string));

    let merged = 0;
    let dropped = 0;
    for (const row of anonVotes) {
      const oid = row.outfit_id as string;
      if (userOutfits.has(oid)) {
        await db
          .prepare(
            "DELETE FROM votes WHERE outfit_id = ? AND user_id = ? AND voter_type = 'anon'"
          )
          .bind(oid, tok)
          .run();
        dropped++;
      } else {
        await db
          .prepare(
            "UPDATE votes SET user_id = ?, voter_type = 'user' WHERE outfit_id = ? AND user_id = ? AND voter_type = 'anon'"
          )
          .bind(userId, oid, tok)
          .run();
        merged++;
      }
    }

    return NextResponse.json({ merged, dropped });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
