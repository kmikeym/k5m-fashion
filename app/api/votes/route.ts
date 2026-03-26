import { NextRequest, NextResponse } from 'next/server';

// Shared in-memory store (matches vote/route.ts)
// TODO: Replace with D1 queries in production
const votes: Map<string, { hot: number; not: number }> = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const outfit_id = searchParams.get('outfit_id');

  if (outfit_id) {
    const tally = votes.get(outfit_id) || { hot: 0, not: 0 };
    return NextResponse.json(tally);
  }

  // Return all tallies
  const all: Record<string, { hot: number; not: number }> = {};
  votes.forEach((v, k) => {
    all[k] = v;
  });
  return NextResponse.json(all);
}
