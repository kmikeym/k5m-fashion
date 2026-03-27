import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const outfit_id = searchParams.get('outfit_id');
  const mine = searchParams.get('mine');

  const { userId } = await auth();
  const db = await getD1();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  // User's own votes
  if (mine === 'true' && userId) {
    const { results } = await db.prepare(
      'SELECT outfit_id, vote, created_at FROM votes WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();
    return NextResponse.json(results);
  }

  // Single outfit tally + user's vote
  if (outfit_id) {
    const tally = await db.prepare(
      `SELECT
        SUM(CASE WHEN vote = 'hot' THEN 1 ELSE 0 END) as hot,
        SUM(CASE WHEN vote = 'not' THEN 1 ELSE 0 END) as not_count
      FROM votes WHERE outfit_id = ?`
    ).bind(outfit_id).first();

    let myVote = null;
    if (userId) {
      const row = await db.prepare(
        'SELECT vote FROM votes WHERE outfit_id = ? AND user_id = ?'
      ).bind(outfit_id, userId).first();
      myVote = row?.vote || null;
    }

    return NextResponse.json({
      hot: tally?.hot || 0,
      not: tally?.not_count || 0,
      myVote,
    });
  }

  // All tallies
  const { results } = await db.prepare(
    `SELECT outfit_id,
      SUM(CASE WHEN vote = 'hot' THEN 1 ELSE 0 END) as hot,
      SUM(CASE WHEN vote = 'not' THEN 1 ELSE 0 END) as not_count
    FROM votes GROUP BY outfit_id`
  ).all();

  const tallies: Record<string, { hot: number; not: number }> = {};
  for (const r of results) {
    tallies[r.outfit_id as string] = {
      hot: (r.hot as number) || 0,
      not: (r.not_count as number) || 0,
    };
  }
  return NextResponse.json(tallies);
}
