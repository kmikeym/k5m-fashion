import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { voteStore } from '@/lib/vote-store';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });
    }

    const { outfit_id, vote } = await request.json();

    if (!outfit_id || (vote !== 0 && vote !== 1)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const choice = vote === 1 ? 'hot' : 'not';
    const added = voteStore.addVote(outfit_id, userId, choice as 'hot' | 'not');

    if (!added) {
      return NextResponse.json({ error: 'Already voted on this outfit' }, { status: 409 });
    }

    const tally = voteStore.getTally(outfit_id);
    return NextResponse.json({ success: true, ...tally });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
