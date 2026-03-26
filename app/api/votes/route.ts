import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { voteStore } from '@/lib/vote-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const outfit_id = searchParams.get('outfit_id');
  const mine = searchParams.get('mine');

  // Get current user (optional — not required for public tallies)
  const { userId } = await auth();

  // User's own votes
  if (mine === 'true' && userId) {
    const userVotes = voteStore.getUserVotes(userId);
    return NextResponse.json(userVotes);
  }

  // Single outfit tally + user's vote on it
  if (outfit_id) {
    const tally = voteStore.getTally(outfit_id);
    const myVote = userId ? voteStore.getUserVoteForOutfit(outfit_id, userId) : null;
    return NextResponse.json({ ...tally, myVote });
  }

  // All tallies
  const all = voteStore.getAllTallies();
  return NextResponse.json(all);
}
