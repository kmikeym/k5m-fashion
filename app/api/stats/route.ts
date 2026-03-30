import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

interface ItemStat {
  id: string;
  name: string;
  category: string;
  appearances: number;
  hotRate: number | null;
  totalVotes: number;
  bestPair: { name: string; synergy: number } | null;
  worstPair: { name: string; synergy: number } | null;
}

export async function GET(request: NextRequest) {
  const { userId: targetUserId } = await auth();
  const db = await getD1();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. Fetch outfits for this user with their items
  const { results: outfitRows } = await db.prepare(
    'SELECT id FROM outfits WHERE user_id = ?'
  ).bind(targetUserId).all();

  const outfitIds = outfitRows.map((r) => r.id as string);

  if (outfitIds.length === 0) {
    return NextResponse.json({
      outfitCount: 0,
      itemCount: 0,
      totalVotes: 0,
      items: [],
    });
  }

  // 2. Fetch outfit_items for these outfits
  const placeholders = outfitIds.map(() => '?').join(',');
  const { results: oiRows } = await db.prepare(
    `SELECT outfit_id, item_id FROM outfit_items WHERE outfit_id IN (${placeholders})`
  ).bind(...outfitIds).all();

  // Build outfit -> items map
  const outfitItems: Record<string, string[]> = {};
  for (const row of oiRows) {
    const oid = row.outfit_id as string;
    const iid = row.item_id as string;
    if (!outfitItems[oid]) outfitItems[oid] = [];
    outfitItems[oid].push(iid);
  }

  // 3. Fetch user-scoped vote tallies (only votes on this user's outfits)
  const { results: voteRows } = await db.prepare(
    `SELECT v.outfit_id,
      SUM(CASE WHEN v.vote = 'hot' THEN 1 ELSE 0 END) as hot,
      SUM(CASE WHEN v.vote = 'not' THEN 1 ELSE 0 END) as not_count
    FROM votes v
    JOIN outfits o ON v.outfit_id = o.id
    WHERE o.user_id = ?
    GROUP BY v.outfit_id`
  ).bind(targetUserId).all();

  const voteTallies: Record<string, { hot: number; not: number }> = {};
  for (const r of voteRows) {
    voteTallies[r.outfit_id as string] = {
      hot: (r.hot as number) || 0,
      not: (r.not_count as number) || 0,
    };
  }

  // 4. Fetch all items (items are global)
  const { results: itemRows } = await db.prepare(
    'SELECT id, type, color, modifier, category FROM items'
  ).all();

  const itemMap: Record<string, { name: string; category: string }> = {};
  for (const r of itemRows) {
    // Build display name from [color] [modifier] [type], matching getDisplayName() logic
    const parts = [r.color, r.modifier, r.type].filter(Boolean);
    const displayName = parts.length > 0 ? parts.join(' ') : (r.id as string);
    itemMap[r.id as string] = {
      name: displayName,
      category: r.category as string,
    };
  }

  // 5. Compute per-item stats
  const itemStats: Record<string, { hot: number; total: number; appearances: number }> = {};
  for (const id of Object.keys(itemMap)) {
    itemStats[id] = { hot: 0, total: 0, appearances: 0 };
  }

  let totalVoteCount = 0;
  for (const outfitId of outfitIds) {
    const votes = voteTallies[outfitId];
    if (!votes) continue;
    const outfitTotal = votes.hot + votes.not;
    totalVoteCount += outfitTotal;

    const items = outfitItems[outfitId] || [];
    for (const itemId of items) {
      if (!itemStats[itemId]) continue;
      itemStats[itemId].hot += votes.hot;
      itemStats[itemId].total += outfitTotal;
      itemStats[itemId].appearances++;
    }
  }

  // 6. Compute pair synergy
  const itemIds = Object.keys(itemMap);
  const pairData: Record<string, { bestPair: { name: string; synergy: number } | null; worstPair: { name: string; synergy: number } | null }> = {};

  for (const a of itemIds) {
    let best: { name: string; synergy: number } | null = null;
    let worst: { name: string; synergy: number } | null = null;

    for (const b of itemIds) {
      if (a === b) continue;
      let pairHot = 0;
      let pairTotal = 0;

      for (const outfitId of outfitIds) {
        const items = outfitItems[outfitId] || [];
        if (!items.includes(a) || !items.includes(b)) continue;
        const votes = voteTallies[outfitId];
        if (!votes) continue;
        pairHot += votes.hot;
        pairTotal += votes.hot + votes.not;
      }

      if (pairTotal === 0) continue;

      const pairRate = pairHot / pairTotal;
      const rateA = itemStats[a]?.total > 0 ? itemStats[a].hot / itemStats[a].total : 0;
      const rateB = itemStats[b]?.total > 0 ? itemStats[b].hot / itemStats[b].total : 0;
      const synergy = Math.round((pairRate - (rateA + rateB) / 2) * 100);
      const bName = itemMap[b]?.name || b;

      if (best === null || synergy > best.synergy) best = { name: bName, synergy };
      if (worst === null || synergy < worst.synergy) worst = { name: bName, synergy };
    }

    pairData[a] = { bestPair: best, worstPair: worst };
  }

  // 7. Assemble response
  const computed: ItemStat[] = itemIds
    .map((id) => ({
      id,
      name: itemMap[id]?.name || id,
      category: itemMap[id]?.category || '',
      appearances: itemStats[id]?.appearances || 0,
      hotRate: itemStats[id]?.total > 0 ? itemStats[id].hot / itemStats[id].total : null,
      totalVotes: itemStats[id]?.total || 0,
      bestPair: pairData[id]?.bestPair || null,
      worstPair: pairData[id]?.worstPair || null,
    }))
    .sort((a, b) => {
      if (a.hotRate === null && b.hotRate === null) return 0;
      if (a.hotRate === null) return 1;
      if (b.hotRate === null) return -1;
      return b.hotRate - a.hotRate;
    });

  return NextResponse.json({
    outfitCount: outfitIds.length,
    itemCount: itemIds.length,
    totalVotes: totalVoteCount,
    items: computed,
  });
}
