import { NextRequest, NextResponse } from 'next/server';

// In-memory vote store (works for dev; D1 replaces this in production)
const votes: Map<string, { hot: number; not: number }> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { outfit_id, vote } = await request.json();

    if (!outfit_id || (vote !== 0 && vote !== 1)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const current = votes.get(outfit_id) || { hot: 0, not: 0 };
    if (vote === 1) current.hot++;
    else current.not++;
    votes.set(outfit_id, current);

    return NextResponse.json({ success: true, ...current });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
