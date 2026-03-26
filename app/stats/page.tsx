'use client';

import { useState, useEffect } from 'react';
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
  bestPair: { name: string; synergy: number } | null;
  worstPair: { name: string; synergy: number } | null;
}

export default function StatsPage() {
  const [itemStats, setItemStats] = useState<ItemStat[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const outfits = outfitsData as Outfit[];
  const items = itemsData as Item[];

  useEffect(() => {
    fetch('/api/votes')
      .then((r) => r.json())
      .then((allVotes: Record<string, { hot: number; not: number }>) => {
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

        const itemIds = items.map((i) => i.id);
        const pairData: Record<string, { bestPair: { name: string; synergy: number } | null; worstPair: { name: string; synergy: number } | null }> = {};

        for (const a of itemIds) {
          let best: { name: string; synergy: number } | null = null;
          let worst: { name: string; synergy: number } | null = null;

          for (const b of itemIds) {
            if (a === b) continue;
            let pairHot = 0;
            let pairTotal = 0;

            for (const outfit of outfits) {
              if (!outfit.items.includes(a) || !outfit.items.includes(b)) continue;
              const votes = allVotes[outfit.id];
              if (!votes) continue;
              pairHot += votes.hot;
              pairTotal += votes.hot + votes.not;
            }

            if (pairTotal === 0) continue;

            const pairRate = pairHot / pairTotal;
            const rateA = stats[a]?.total > 0 ? stats[a].hot / stats[a].total : 0;
            const rateB = stats[b]?.total > 0 ? stats[b].hot / stats[b].total : 0;
            const synergy = Math.round((pairRate - (rateA + rateB) / 2) * 100);
            const bName = items.find((x) => x.id === b)?.name || b;

            if (best === null || synergy > best.synergy) best = { name: bName, synergy };
            if (worst === null || synergy < worst.synergy) worst = { name: bName, synergy };
          }

          pairData[a] = { bestPair: best, worstPair: worst };
        }

        const computed: ItemStat[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          appearances: stats[item.id]?.appearances || 0,
          hotRate: stats[item.id]?.total > 0 ? stats[item.id].hot / stats[item.id].total : null,
          totalVotes: stats[item.id]?.total || 0,
          bestPair: pairData[item.id]?.bestPair || null,
          worstPair: pairData[item.id]?.worstPair || null,
        }));

        computed.sort((a, b) => {
          if (a.hotRate === null && b.hotRate === null) return 0;
          if (a.hotRate === null) return 1;
          if (b.hotRate === null) return -1;
          return b.hotRate - a.hotRate;
        });

        setItemStats(computed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section
      className="relative z-10 flex flex-col w-full"
      style={{
        background: 'var(--grad-cool)',
        borderTop: '1px solid var(--color-text)',
      }}
    >
      <div className="max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        {/* Header */}
        <div className="mb-12">
          <p className="txt-meta mb-4">System Intelligence</p>
          <h2 className="txt-display-outline">Wardrobe</h2>
          <h3 className="txt-display-solid">Correlations</h3>
        </div>

        {/* Summary */}
        <div className="flex gap-8 mb-12">
          <div>
            <span className="metric-val">{outfits.length}</span>
            <p className="txt-meta font-semibold uppercase mt-1">Outfits</p>
          </div>
          <div>
            <span className="metric-val">{items.length}</span>
            <p className="txt-meta font-semibold uppercase mt-1">Items</p>
          </div>
          <div>
            <span className="metric-val">{totalVotes}</span>
            <p className="txt-meta font-semibold uppercase mt-1">Votes</p>
          </div>
        </div>

        {loading ? (
          <p className="txt-meta opacity-50">Loading vote data...</p>
        ) : totalVotes === 0 ? (
          <div className="py-16">
            <h2 className="txt-display-outline">No Votes</h2>
            <h3 className="txt-display-solid">Yet</h3>
            <p className="txt-meta opacity-50 mt-4">
              Vote on some outfits to see correlations
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {itemStats.map((stat) => {
              const score = stat.hotRate !== null ? Math.round(stat.hotRate * 100) : null;
              const isLow = score !== null && score < 50;
              const synergy = stat.bestPair && stat.bestPair.synergy > 0
                ? { type: 'Synergy', label: `+${stat.bestPair.synergy} w/ ${stat.bestPair.name}` }
                : stat.worstPair && stat.worstPair.synergy < 0
                ? { type: 'Drag', label: `${stat.worstPair.synergy} w/ ${stat.worstPair.name}` }
                : null;

              return (
                <div key={stat.id} className="data-row">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold leading-tight tracking-tight">
                      {stat.name}
                    </span>
                    <span className="txt-meta uppercase opacity-70">
                      {stat.category}
                    </span>
                    {synergy && (
                      <div className="synergy-detail">
                        <span>{synergy.type}</span>
                        <span className="font-semibold">{synergy.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`metric-val ${isLow ? 'outline' : ''}`}>
                        {score ?? '—'}
                      </span>
                      <span className="txt-meta font-semibold uppercase mt-1">
                        Score
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
