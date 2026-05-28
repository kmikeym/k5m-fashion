import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';
import { instrumentScore, type ItemTally } from '@/lib/instrument';

export const runtime = 'edge';

// THE INSTRUMENT score for a fit — public (the outfit screen shows it to
// anonymous visitors, and it carries cold-start before THE ROOM has votes).
// GET /api/instrument?outfit_id=...  ->  { score, baseline, revised, asOf }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const outfitId = searchParams.get('outfit_id');
  if (!outfitId) {
    return NextResponse.json({ error: 'outfit_id required' }, { status: 400 });
  }

  const db = await getD1();
  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  // 1. The fit's items.
  const { results: itemRows } = await db
    .prepare('SELECT item_id FROM outfit_items WHERE outfit_id = ?')
    .bind(outfitId)
    .all();
  const itemIds = itemRows.map((r) => r.item_id as string);

  // 2. Each item's catalog-wide HIT-rate (votes across ALL fits containing it).
  const tallyById: Record<string, ItemTally> = {};
  for (const id of itemIds) tallyById[id] = { hits: 0, total: 0 };

  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => '?').join(',');
    const { results: voteRows } = await db
      .prepare(
        `SELECT oi.item_id AS item_id,
           SUM(CASE WHEN v.vote = 'hot' THEN 1 ELSE 0 END) AS hits,
           COUNT(v.id) AS total
         FROM outfit_items oi
         JOIN votes v ON v.outfit_id = oi.outfit_id
         WHERE oi.item_id IN (${placeholders})
         GROUP BY oi.item_id`
      )
      .bind(...itemIds)
      .all();
    for (const r of voteRows) {
      tallyById[r.item_id as string] = {
        hits: (r.hits as number) || 0,
        total: (r.total as number) || 0,
      };
    }
  }

  const score = instrumentScore(Object.values(tallyById));

  // 3. Revised marker: compare live score against the post-time baseline.
  const outfitRow = await db
    .prepare('SELECT instrument_baseline FROM outfits WHERE id = ?')
    .bind(outfitId)
    .first();
  const baseline =
    outfitRow && outfitRow.instrument_baseline != null
      ? (outfitRow.instrument_baseline as number)
      : null;
  const revised = baseline != null && Math.abs(score - baseline) >= 0.1;

  return NextResponse.json({
    score,
    baseline,
    revised,
    asOf: revised ? new Date().toISOString().slice(0, 10) : null,
  });
}
