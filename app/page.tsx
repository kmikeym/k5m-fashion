'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [queue, setQueue] = useState<Outfit[]>([]);

  // Build the queue: most recent first, filter out already-voted
  const buildQueue = useCallback(() => {
    const voted = new Set<string>();
    for (const outfit of allOutfits) {
      const v = localStorage.getItem(`vote-${outfit.id}`);
      if (v === 'hot' || v === 'not') voted.add(outfit.id);
    }
    setVotedIds(voted);

    const unrated = allOutfits.filter((o) => !voted.has(o.id));
    setQueue(unrated);
    setCurrentIndex(unrated.length > 0 ? 0 : null);
  }, []);

  useEffect(() => {
    buildQueue();
  }, [buildQueue]);

  // Listen for votes from OutfitCard
  useEffect(() => {
    const handler = () => {
      // Small delay to let localStorage update
      setTimeout(() => {
        buildQueue();
      }, 300);
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

      {/* Single outfit card */}
      {currentOutfit ? (
        <div className="max-w-3xl mx-auto w-full">
          <OutfitCard
            key={currentOutfit.id}
            outfit={currentOutfit}
            items={getItemsForOutfit(currentOutfit)}
          />
        </div>
      ) : (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '80px var(--pad)' }}
        >
          {totalOutfits === 0 ? (
            <>
              <h2 className="txt-display-outline">No Fits</h2>
              <h3 className="txt-display-solid">Yet</h3>
              <p className="txt-meta opacity-50 mt-4">
                Add outfits to data/outfits.json
              </p>
            </>
          ) : (
            <>
              <h2 className="txt-display-outline">All</h2>
              <h3 className="txt-display-solid">Rated</h3>
              <p className="txt-meta opacity-50 mt-4">
                {totalRated} outfits evaluated. Check the stats.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
