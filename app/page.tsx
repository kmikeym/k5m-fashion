'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import OutfitCard from '@/components/OutfitCard';
import outfitsData from '@/data/outfits.json';
import itemsData from '@/data/items.json';
import type { Outfit, Item } from '@/lib/types';

export default function Home() {
  const { isSignedIn } = useUser();
  const allOutfits = (outfitsData as Outfit[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const allItems = itemsData as Item[];

  const [queue, setQueue] = useState<Outfit[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [myVotes, setMyVotes] = useState<Record<string, 'hot' | 'not'>>({});
  const [tallies, setTallies] = useState<Record<string, { hot: number; not: number }>>({});

  const refresh = useCallback(() => {
    // Fetch all tallies
    fetch('/api/votes')
      .then((r) => r.json())
      .then((data) => setTallies(data))
      .catch(() => {});

    // Fetch user's votes if signed in
    if (isSignedIn) {
      fetch('/api/votes?mine=true')
        .then((r) => r.json())
        .then((records: { outfit_id: string; vote: 'hot' | 'not' }[]) => {
          const voted = new Set<string>();
          const voteMap: Record<string, 'hot' | 'not'> = {};
          for (const r of records) {
            voted.add(r.outfit_id);
            voteMap[r.outfit_id] = r.vote;
          }
          setVotedIds(voted);
          setMyVotes(voteMap);
          setQueue(allOutfits.filter((o) => !voted.has(o.id)));
        })
        .catch(() => {});
    } else {
      // Not signed in — no voted state
      setVotedIds(new Set());
      setMyVotes({});
      setQueue(allOutfits);
    }
  }, [isSignedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => setTimeout(() => refresh(), 500);
    window.addEventListener('outfit-voted', handler);
    return () => window.removeEventListener('outfit-voted', handler);
  }, [refresh]);

  const currentOutfit = queue.length > 0 ? queue[0] : null;

  function getItemsForOutfit(outfit: Outfit): Item[] {
    return outfit.items
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as Item[];
  }

  const totalOutfits = allOutfits.length;
  const totalRated = votedIds.size;

  return (
    <>
      {/* Hero */}
      <div
        className="relative z-10 max-w-3xl mx-auto w-full"
        style={{ padding: '0 var(--pad) 24px' }}
      >
        <div className="mb-2">
          <h1 className="txt-display-outline">Daily Fit</h1>
          <h2 className="txt-display-solid">Evaluation</h2>
        </div>
        {isSignedIn && (
          <p className="txt-meta opacity-60">
            {totalRated} of {totalOutfits} rated
            {queue.length > 0 && <> &middot; {queue.length} remaining</>}
          </p>
        )}
      </div>

      {/* Single outfit card (if unrated remain or not signed in) */}
      {currentOutfit ? (
        <div className="max-w-3xl mx-auto w-full">
          <OutfitCard
            key={currentOutfit.id}
            outfit={currentOutfit}
            items={getItemsForOutfit(currentOutfit)}
          />
        </div>
      ) : totalOutfits === 0 ? (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '80px var(--pad)' }}
        >
          <h2 className="txt-display-outline">No Fits</h2>
          <h3 className="txt-display-solid">Yet</h3>
          <p className="txt-meta opacity-50 mt-4">
            Add outfits to data/outfits.json
          </p>
        </div>
      ) : isSignedIn ? (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '48px var(--pad)' }}
        >
          <h2 className="txt-display-outline">All</h2>
          <h3 className="txt-display-solid">Rated</h3>
          <p className="txt-meta opacity-50 mt-4">
            {totalRated} outfits evaluated &middot;{' '}
            <Link href="/stats" className="underline hover:opacity-70">Check the stats</Link>
          </p>
        </div>
      ) : null}

      {/* Archive Grid */}
      {totalOutfits > 0 && (
        <section
          className="relative z-10 w-full"
          style={{ borderTop: '1px solid var(--color-text)' }}
        >
          <div
            className="max-w-3xl mx-auto w-full"
            style={{ padding: '48px var(--pad)' }}
          >
            <div className="mb-6">
              <p className="txt-meta font-semibold uppercase opacity-60">
                All Outfits &middot; {totalOutfits} total
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {allOutfits.map((outfit) => {
                const vote = myVotes[outfit.id];
                const tally = tallies[outfit.id];
                const total = tally ? tally.hot + tally.not : 0;
                const hotPct = total > 0 ? Math.round((tally.hot / total) * 100) : null;

                return (
                  <Link
                    key={outfit.id}
                    href={`/outfits/${outfit.id}`}
                    className="relative group"
                  >
                    <div className="aspect-[3/4] overflow-hidden border border-ink/10">
                      <img
                        src={outfit.image}
                        alt={outfit.description || 'Outfit'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Score badge */}
                      {hotPct !== null && (
                        <div
                          className="absolute top-1 right-1 px-1.5 py-0.5"
                          style={{
                            background: 'rgba(255,255,255,0.85)',
                            fontSize: '8px',
                            fontWeight: 700,
                          }}
                        >
                          {hotPct}%
                        </div>
                      )}
                      {/* Your vote badge */}
                      {vote && (
                        <div
                          className="absolute bottom-1 right-1 px-1.5 py-0.5"
                          style={{
                            background: vote === 'hot' ? 'var(--color-text)' : 'rgba(255,255,255,0.85)',
                            color: vote === 'hot' ? '#fff' : 'var(--color-text)',
                            fontSize: '8px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {vote}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
