// Shared in-memory vote store
// TODO: Replace with D1 in production

interface VoteRecord {
  outfit_id: string;
  user_id: string;
  vote: 'hot' | 'not';
  created_at: string;
}

class VoteStore {
  private votes: VoteRecord[] = [];

  addVote(outfit_id: string, user_id: string, vote: 'hot' | 'not'): boolean {
    // Check if user already voted on this outfit
    const existing = this.votes.find(
      (v) => v.outfit_id === outfit_id && v.user_id === user_id
    );
    if (existing) return false;

    this.votes.push({
      outfit_id,
      user_id,
      vote,
      created_at: new Date().toISOString(),
    });
    return true;
  }

  getTally(outfit_id: string): { hot: number; not: number } {
    const outfitVotes = this.votes.filter((v) => v.outfit_id === outfit_id);
    return {
      hot: outfitVotes.filter((v) => v.vote === 'hot').length,
      not: outfitVotes.filter((v) => v.vote === 'not').length,
    };
  }

  getAllTallies(): Record<string, { hot: number; not: number }> {
    const tallies: Record<string, { hot: number; not: number }> = {};
    for (const v of this.votes) {
      if (!tallies[v.outfit_id]) tallies[v.outfit_id] = { hot: 0, not: 0 };
      tallies[v.outfit_id][v.vote]++;
    }
    return tallies;
  }

  getUserVotes(user_id: string): VoteRecord[] {
    return this.votes
      .filter((v) => v.user_id === user_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getUserVoteForOutfit(outfit_id: string, user_id: string): 'hot' | 'not' | null {
    const vote = this.votes.find(
      (v) => v.outfit_id === outfit_id && v.user_id === user_id
    );
    return vote?.vote || null;
  }
}

// Singleton
export const voteStore = new VoteStore();
