import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });
    }

    const body = await request.json() as { outfit_id?: string; vote?: number };
    const { outfit_id, vote } = body;
    if (!outfit_id || (vote !== 0 && vote !== 1)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const choice = vote === 1 ? 'hot' : 'not';
    const db = await getD1();

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Insert vote (UNIQUE constraint prevents duplicates)
    try {
      await db.prepare(
        'INSERT INTO votes (outfit_id, user_id, vote) VALUES (?, ?, ?)'
      ).bind(outfit_id, userId, choice).run();
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes('UNIQUE')) {
        return NextResponse.json({ error: 'Already voted' }, { status: 409 });
      }
      throw e;
    }

    // Return updated tally
    const tally = await db.prepare(
      `SELECT
        SUM(CASE WHEN vote = 'hot' THEN 1 ELSE 0 END) as hot,
        SUM(CASE WHEN vote = 'not' THEN 1 ELSE 0 END) as not_count
      FROM votes WHERE outfit_id = ?`
    ).bind(outfit_id).first();

    return NextResponse.json({
      success: true,
      hot: tally?.hot || 0,
      not: tally?.not_count || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
