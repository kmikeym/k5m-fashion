import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

// Anonymous-first voting (#15, 2026-05-28): a vote needs NO login. The voter is
// a Clerk user when signed in, otherwise an anonymous device token. IP is used
// only as a rate-limit signal, never as identity (carrier NAT + the IG in-app
// browser put many real users behind one IP).
const RATE_LIMIT_PER_MIN = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      outfit_id?: string;
      vote?: number;
      token?: string;
    };
    const { outfit_id, vote, token } = body;

    if (!outfit_id || (vote !== 0 && vote !== 1)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Resolve the voter: Clerk user if signed in, else the anon device token.
    const { userId } = await auth();
    const voter = userId || (token && token.trim() ? token.trim() : null);
    const voterType = userId ? 'user' : 'anon';
    if (!voter) {
      return NextResponse.json({ error: 'No voter identity' }, { status: 400 });
    }

    const choice = vote === 1 ? 'hot' : 'not';
    const ip = request.headers.get('cf-connecting-ip') || null;

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Rate-limit by IP only (abuse signal, not identity).
    if (ip) {
      const recent = await db
        .prepare(
          `SELECT COUNT(*) AS n FROM votes
           WHERE ip = ? AND created_at >= datetime('now', '-1 minute')`
        )
        .bind(ip)
        .first();
      if (((recent?.n as number) || 0) >= RATE_LIMIT_PER_MIN) {
        return NextResponse.json({ error: 'Too many votes' }, { status: 429 });
      }
    }

    // Insert the vote (UNIQUE(outfit_id, user_id) dedups either voter kind).
    try {
      await db
        .prepare(
          'INSERT INTO votes (outfit_id, user_id, vote, voter_type, ip) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(outfit_id, voter, choice, voterType, ip)
        .run();
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes('UNIQUE')) {
        return NextResponse.json({ error: 'Already voted' }, { status: 409 });
      }
      throw e;
    }

    // Return the settled tally (Law 3: the client reveals this as already-decided,
    // it must not add the just-cast vote to the displayed average itself).
    const tally = await db
      .prepare(
        `SELECT
          SUM(CASE WHEN vote = 'hot' THEN 1 ELSE 0 END) as hot,
          SUM(CASE WHEN vote = 'not' THEN 1 ELSE 0 END) as not_count
        FROM votes WHERE outfit_id = ?`
      )
      .bind(outfit_id)
      .first();

    return NextResponse.json({
      success: true,
      hot: tally?.hot || 0,
      not: tally?.not_count || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
