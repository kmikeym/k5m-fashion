'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import OutfitCard from '@/components/OutfitCard';
import outfitsData from '@/data/outfits.json';
import itemsData from '@/data/items.json';
import type { Outfit, Item } from '@/lib/types';

export default function Home() {
  const allOutfits = (outfitsData as Outfit[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const allItems = itemsData as Item[];

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, 'hot' | 'not'>>({});
  const [queue, setQueue] = useState<Outfit[]>([]);

  const buildQueue = useCallback(() => {
    const voted = new Set<string>();
    const voteMap: Record<string, 'hot' | 'not'> = {};
    for (const outfit of allOutfits) {
      const v = localStorage.getItem(`vote-${outfit.id}`);
      if (v === 'hot' || v === 'not') {
        voted.add(outfit.id);
        voteMap[outfit.id] = v;
      }
    }
    setVotedIds(voted);
    setVotes(voteMap);

    const unrated = allOutfits.filter((o) => !voted.has(o.id));
    setQueue(unrated);
    setCurrentIndex(unrated.length > 0 ? 0 : null);
  }, []);

  useEffect(() => {
    buildQueue();
  }, [buildQueue]);

  useEffect(() => {
    const handler = () => {
      setTimeout(() => buildQueue(), 300);
    };
    window.addEventListener('outfit-voted', handler);
    return () => window.removeEventListener('outfit-voted', handler);
  }, [buildQueue]);

  const currentOutfit = currentIndex !== null ? queue[currentIndex] : null;

  function getItemsForOutfit(outfit: Outfit): Item[] {
    return outfit.items
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as Item[];
  }

  const totalOutfits = allOutfits.length;
  const totalRated = votedIds.size;
  const remaining = queue.length;

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
        <p className="txt-meta opacity-60">
          {totalRated} of {totalOutfits} rated
          {remaining > 0 && <> &middot; {remaining} remaining</>}
        </p>
      </div>

      {/* Single outfit card (if unrated remain) */}
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
      ) : null}

      {/* Archive Grid — always visible when there are rated outfits */}
      {totalRated > 0 && (
        <section
          className="relative z-10 w-full"
          style={{
            borderTop: '1px solid var(--color-text)',
            marginTop: currentOutfit ? '0' : '0',
          }}
        >
          <div
            className="max-w-3xl mx-auto w-full"
            style={{ padding: '48px var(--pad)' }}
          >
            <div className="mb-6">
              <p className="txt-meta font-semibold uppercase opacity-60">
                Archive &middot; {totalRated} rated
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {allOutfits.map((outfit) => {
                const vote = votes[outfit.id];
                const isRated = votedIds.has(outfit.id);

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
                        style={{ opacity: isRated ? 1 : 0.4 }}
                      />
                      {/* Vote indicator */}
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
