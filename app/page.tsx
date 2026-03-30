'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import OutfitCard from '@/components/OutfitCard';
import itemsData from '@/data/items.json';
import type { Outfit, Item } from '@/lib/types';
import { GENERAL_USER_ID } from '@/lib/constants';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const allItems = itemsData as Item[];

  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [archiveOutfits, setArchiveOutfits] = useState<Outfit[]>([]);
  const [queue, setQueue] = useState<Outfit[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [myVotes, setMyVotes] = useState<Record<string, 'hot' | 'not'>>({});
  const [tallies, setTallies] = useState<Record<string, { hot: number; not: number }>>({});
  const [fetchError, setFetchError] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'mine' | 'general'>('all');
  const [allOutfitCount, setAllOutfitCount] = useState(0);

  const refresh = useCallback(() => {
    setFetchError(false);

    // Fetch outfits from D1 (exclude own if signed in)
    const outfitUrl = isSignedIn ? '/api/outfits?exclude_own=true' : '/api/outfits';
    fetch(outfitUrl)
      .then((r) => r.json())
      .then((data) => {
        const outfits = (data as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAllOutfits(outfits);
      })
      .catch(() => setFetchError(true));

    // Fetch total outfit count (unfiltered) for hero stats
    fetch('/api/outfits')
      .then((r) => r.json())
      .then((data) => setAllOutfitCount((data as Outfit[]).length))
      .catch(() => {});

    // Fetch all tallies
    fetch('/api/votes')
      .then((r) => r.json())
      .then((data) => setTallies(data as Record<string, { hot: number; not: number }>))
      .catch(() => setFetchError(true));

    // Fetch user's votes if signed in
    if (isSignedIn) {
      fetch('/api/votes?mine=true')
        .then((r) => r.json())
        .then((data) => data as { outfit_id: string; vote: 'hot' | 'not' }[])
        .then((records) => {
          const voted = new Set<string>();
          const voteMap: Record<string, 'hot' | 'not'> = {};
          for (const r of records) {
            voted.add(r.outfit_id);
            voteMap[r.outfit_id] = r.vote;
          }
          setVotedIds(voted);
          setMyVotes(voteMap);
        })
        .catch(() => setFetchError(true));
    } else {
      setVotedIds(new Set());
      setMyVotes({});
    }
  }, [isSignedIn]);

  // Sync queue when outfits or votes change
  useEffect(() => {
    if (isSignedIn) {
      setQueue(allOutfits.filter((o) => !votedIds.has(o.id)));
    } else {
      setQueue(allOutfits);
    }
  }, [allOutfits, votedIds, isSignedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fetch archive outfits (responds to filter changes)
  const fetchArchive = useCallback(() => {
    let archiveUrl = '/api/outfits';
    if (archiveFilter === 'mine' && user?.id) {
      archiveUrl = `/api/outfits?user_id=${user.id}`;
    } else if (archiveFilter === 'general') {
      archiveUrl = `/api/outfits?user_id=${GENERAL_USER_ID}`;
    }
    fetch(archiveUrl)
      .then((r) => r.json())
      .then((data) => {
        setArchiveOutfits((data as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      })
      .catch(() => {});
  }, [archiveFilter, user?.id]);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  useEffect(() => {
    const handler = () => setTimeout(() => { refresh(); fetchArchive(); }, 500);
    window.addEventListener('outfit-voted', handler);
    return () => window.removeEventListener('outfit-voted', handler);
  }, [refresh, fetchArchive]);

  const currentOutfit = queue.length > 0 ? queue[0] : null;

  function getItemsForOutfit(outfit: Outfit): Item[] {
    return outfit.items
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as Item[];
  }

  const totalOutfits = allOutfitCount;
  const filteredOutfitCount = archiveOutfits.length;
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
            {totalRated} of {totalOutfits} voted
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
          <h3 className="txt-display-solid">Voted</h3>
          <p className="txt-meta opacity-50 mt-4">
            {totalRated} fits voted on &middot;{' '}
            <Link href="/stats" className="underline hover:opacity-70">Check the stats</Link>
          </p>
        </div>
      ) : null}

      {/* Fetch error */}
      {fetchError && (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '8px var(--pad)' }}
        >
          <span className="txt-meta opacity-50">Couldn&apos;t load vote data — try refreshing</span>
        </div>
      )}

      {/* Archive Grid */}
      {(totalOutfits > 0 || filteredOutfitCount > 0) && (
        <section
          className="relative z-10 w-full"
          style={{ borderTop: '1px solid var(--color-text)' }}
        >
          <div
            className="max-w-3xl mx-auto w-full"
            style={{ padding: '48px var(--pad)' }}
          >
            <div className="mb-6 flex items-baseline justify-between">
              <p className="txt-meta font-semibold uppercase opacity-60">
                {archiveFilter === 'all' ? 'All Fits' : archiveFilter === 'mine' ? 'My Fits' : 'Editorial'} &middot; {filteredOutfitCount} total
              </p>
              {isSignedIn && (
                <div className="flex gap-4">
                  {(['all', 'mine', 'general'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setArchiveFilter(f)}
                      className={`txt-meta font-semibold uppercase transition-opacity ${archiveFilter === f ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                    >
                      {f === 'all' ? 'All' : f === 'mine' ? 'My Fits' : 'Editorial'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {archiveOutfits.map((outfit) => {
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
                        alt={outfit.description || 'Fit'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const img = e.currentTarget;
                          const parent = img.parentElement;
                          if (parent) {
                            img.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'outfit-img-fallback';
                            const label = document.createElement('span');
                            label.className = 'txt-meta font-bold';
                            label.textContent = new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            fallback.appendChild(label);
                            parent.insertBefore(fallback, parent.firstChild);
                          }
                        }}
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
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {vote === 'hot' ? '+' : '−'}
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
