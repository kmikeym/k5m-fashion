'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import outfitsData from '@/data/outfits.json';
import itemsData from '@/data/items.json';
import type { Outfit, Item } from '@/lib/types';

interface ItemStat {
  id: string;
  name: string;
  category: string;
  appearances: number;
  hotRate: number | null;
  totalVotes: number;
}

interface PairStat {
  itemA: string;
  itemB: string;
  nameA: string;
  nameB: string;
  synergy: number;
  hotRateTogether: number;
  appearances: number;
}

export default function StatsPage() {
  const [itemStats, setItemStats] = useState<ItemStat[]>([]);
  const [pairStats, setPairStats] = useState<PairStat[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const outfits = outfitsData as Outfit[];
  const items = itemsData as Item[];

  useEffect(() => {
    fetch('/api/votes')
      .then((r) => r.json())
      .then((allVotes: Record<string, { hot: number; not: number }>) => {
        // Compute item stats
        const stats: Record<string, { hot: number; total: number; appearances: number }> = {};

        for (const item of items) {
          stats[item.id] = { hot: 0, total: 0, appearances: 0 };
        }

        let total = 0;
        for (const outfit of outfits) {
          const votes = allVotes[outfit.id];
          if (!votes) continue;
          const outfitTotal = votes.hot + votes.not;
          total += outfitTotal;

          for (const itemId of outfit.items) {
            if (!stats[itemId]) continue;
            stats[itemId].hot += votes.hot;
            stats[itemId].total += outfitTotal;
            stats[itemId].appearances++;
          }
        }

        setTotalVotes(total);

        const computed: ItemStat[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          appearances: stats[item.id]?.appearances || 0,
          hotRate:
            stats[item.id]?.total > 0
              ? stats[item.id].hot / stats[item.id].total
              : null,
          totalVotes: stats[item.id]?.total || 0,
        }));

        computed.sort((a, b) => {
          if (a.hotRate === null && b.hotRate === null) return 0;
          if (a.hotRate === null) return 1;
          if (b.hotRate === null) return -1;
          return b.hotRate - a.hotRate;
        });

        setItemStats(computed);

        // Compute pair synergies
        const pairs: PairStat[] = [];
        const itemIds = items.map((i) => i.id);

        for (let i = 0; i < itemIds.length; i++) {
          for (let j = i + 1; j < itemIds.length; j++) {
            const a = itemIds[i];
            const b = itemIds[j];

            let pairHot = 0;
            let pairTotal = 0;
            let pairAppearances = 0;

            for (const outfit of outfits) {
              if (!outfit.items.includes(a) || !outfit.items.includes(b)) continue;
              const votes = allVotes[outfit.id];
              if (!votes) continue;
              pairHot += votes.hot;
              pairTotal += votes.hot + votes.not;
              pairAppearances++;
            }

            if (pairAppearances === 0) continue;

            const pairRate = pairTotal > 0 ? pairHot / pairTotal : 0;
            const rateA = stats[a]?.total > 0 ? stats[a].hot / stats[a].total : 0;
            const rateB = stats[b]?.total > 0 ? stats[b].hot / stats[b].total : 0;
            const avgApart = (rateA + rateB) / 2;

            pairs.push({
              itemA: a,
              itemB: b,
              nameA: items.find((x) => x.id === a)?.name || a,
              nameB: items.find((x) => x.id === b)?.name || b,
              synergy: pairRate - avgApart,
              hotRateTogether: pairRate,
              appearances: pairAppearances,
            });
          }
        }

        pairs.sort((a, b) => Math.abs(b.synergy) - Math.abs(a.synergy));
        setPairStats(pairs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-display text-5xl italic text-ink mb-2">Stats</h2>
      <p className="text-smoke font-body text-lg mb-10">
        What the votes reveal about your wardrobe.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="border border-blush/40 bg-white p-5 text-center">
          <p className="stat-value text-ink">{outfits.length}</p>
          <p className="text-[10px] font-mono text-smoke/60 tracking-wider uppercase mt-1">
            Outfits
          </p>
        </div>
        <div className="border border-blush/40 bg-white p-5 text-center">
          <p className="stat-value text-ink">{items.length}</p>
          <p className="text-[10px] font-mono text-smoke/60 tracking-wider uppercase mt-1">
            Items
          </p>
        </div>
        <div className="border border-blush/40 bg-white p-5 text-center">
          <p className="stat-value text-ink">{totalVotes}</p>
          <p className="text-[10px] font-mono text-smoke/60 tracking-wider uppercase mt-1">
            Votes
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-smoke font-mono text-sm">Loading vote data...</p>
      ) : totalVotes === 0 ? (
        <div className="text-center py-16 border border-dashed border-blush">
          <p className="font-display text-2xl italic text-smoke/50">
            No votes yet
          </p>
          <p className="text-sm text-smoke/40 mt-2 font-mono">
            Vote on some outfits to see stats
          </p>
        </div>
      ) : (
        <>
          {/* Item Rankings */}
          <div className="mb-12">
            <h3 className="text-[11px] font-mono tracking-[0.2em] uppercase text-smoke/60 mb-4 border-b border-blush/40 pb-2">
              Item Performance
            </h3>
            <div className="border border-blush/40 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blush/40">
                    <th className="text-left px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                      Item
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                      Category
                    </th>
                    <th className="text-right px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                      Fits
                    </th>
                    <th className="text-right px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                      Hot Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemStats.map((stat) => (
                    <tr
                      key={stat.id}
                      className="border-b border-blush/20 last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/items/${stat.id}`}
                          className="text-sm font-body text-ink hover:text-hot transition-colors"
                        >
                          {stat.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-smoke/60">
                        {stat.category}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-mono text-smoke">
                        {stat.appearances}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {stat.hotRate !== null ? (
                          <span
                            className="text-sm font-mono font-medium"
                            style={{
                              color:
                                stat.hotRate >= 0.6
                                  ? '#D4503A'
                                  : stat.hotRate <= 0.4
                                  ? '#8B9DAF'
                                  : '#6B6B6B',
                            }}
                          >
                            {Math.round(stat.hotRate * 100)}%
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-smoke/30">
                            &mdash;
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pair Synergies */}
          {pairStats.length > 0 && (
            <div>
              <h3 className="text-[11px] font-mono tracking-[0.2em] uppercase text-smoke/60 mb-4 border-b border-blush/40 pb-2">
                Pair Synergy
              </h3>
              <p className="text-xs text-smoke/50 font-body mb-4">
                Positive = better together. Negative = they clash.
              </p>
              <div className="border border-blush/40 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blush/40">
                      <th className="text-left px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                        Pair
                      </th>
                      <th className="text-right px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                        Together
                      </th>
                      <th className="text-right px-4 py-2 text-[10px] font-mono tracking-wider uppercase text-smoke/60">
                        Synergy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairStats.slice(0, 10).map((pair, i) => (
                      <tr
                        key={i}
                        className="border-b border-blush/20 last:border-0"
                      >
                        <td className="px-4 py-2.5 text-sm font-body text-ink">
                          {pair.nameA} + {pair.nameB}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-mono text-smoke">
                          {pair.appearances}x
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className="text-sm font-mono font-medium"
                            style={{
                              color:
                                pair.synergy > 0.05
                                  ? '#D4503A'
                                  : pair.synergy < -0.05
                                  ? '#8B9DAF'
                                  : '#6B6B6B',
                            }}
                          >
                            {pair.synergy > 0 ? '+' : ''}
                            {Math.round(pair.synergy * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
