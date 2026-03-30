'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

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

interface StatsResponse {
  outfitCount: number;
  itemCount: number;
  totalVotes: number;
  items: ItemStat[];
}

export default function StatsPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => data as StatsResponse)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
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
          {user && (
            <p className="txt-meta opacity-50 mt-2">
              Stats for your outfits only
            </p>
          )}
        </div>

        {/* Summary */}
        {stats && (
          <div className="flex gap-8 mb-12">
            <div>
              <span className="metric-val">{stats.outfitCount}</span>
              <p className="txt-meta font-semibold uppercase mt-1">Outfits</p>
            </div>
            <div>
              <span className="metric-val">{stats.itemCount}</span>
              <p className="txt-meta font-semibold uppercase mt-1">Items</p>
            </div>
            <div>
              <span className="metric-val">{stats.totalVotes}</span>
              <p className="txt-meta font-semibold uppercase mt-1">Votes</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="txt-meta opacity-50">Loading vote data...</p>
        ) : fetchError ? (
          <p className="txt-meta opacity-50">Couldn&apos;t load vote data — try refreshing</p>
        ) : !stats || stats.totalVotes === 0 ? (
          <div className="py-16">
            <h2 className="txt-display-outline">No Votes</h2>
            <h3 className="txt-display-solid">Yet</h3>
            <p className="txt-meta opacity-50 mt-4">
              Vote on some outfits to see correlations
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {stats.items.map((stat) => {
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
