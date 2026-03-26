'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Outfit, Item } from '@/lib/types';

interface OutfitCardProps {
  outfit: Outfit;
  items: Item[];
}

export default function OutfitCard({ outfit, items }: OutfitCardProps) {
  const [voted, setVoted] = useState<'hot' | 'not' | null>(null);
  const [hotCount, setHotCount] = useState(0);
  const [notCount, setNotCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage for previous vote
    const prev = localStorage.getItem(`vote-${outfit.id}`);
    if (prev === 'hot' || prev === 'not') setVoted(prev);

    // Fetch current tallies
    fetch(`/api/votes?outfit_id=${outfit.id}`)
      .then((r) => r.json())
      .then((data) => {
        setHotCount(data.hot || 0);
        setNotCount(data.not || 0);
      })
      .catch(() => {});
  }, [outfit.id]);

  async function vote(choice: 'hot' | 'not') {
    if (voted || loading) return;
    setLoading(true);

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit_id: outfit.id, vote: choice === 'hot' ? 1 : 0 }),
      });

      localStorage.setItem(`vote-${outfit.id}`, choice);
      setVoted(choice);
      if (choice === 'hot') setHotCount((c) => c + 1);
      else setNotCount((c) => c + 1);
    } catch {
      // Offline or API not ready — still record locally
      localStorage.setItem(`vote-${outfit.id}`, choice);
      setVoted(choice);
      if (choice === 'hot') setHotCount((c) => c + 1);
      else setNotCount((c) => c + 1);
    }

    setLoading(false);
  }

  const total = hotCount + notCount;
  const hotPct = total > 0 ? Math.round((hotCount / total) * 100) : null;

  const formattedDate = new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="outfit-card">
      {/* Photo */}
      <Link href={`/outfits/${outfit.id}`}>
        <div className="aspect-[3/4] bg-blush/30 relative overflow-hidden">
          <img
            src={outfit.image}
            alt={outfit.description}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1">
            <span className="text-[11px] font-mono tracking-wider text-smoke">
              {formattedDate}
            </span>
          </div>
          {/* Score badge (if votes exist) */}
          {hotPct !== null && (
            <div className="absolute top-3 right-3 bg-ink/80 backdrop-blur-sm px-2.5 py-1">
              <span
                className="text-[11px] font-mono tracking-wider"
                style={{ color: hotPct >= 50 ? '#D4503A' : '#8B9DAF' }}
              >
                {hotPct}%
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm text-ink leading-relaxed mb-3">
          {outfit.description}
        </p>

        {/* Item tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {items.length === 0 && (
            <span className="text-[10px] font-mono text-smoke/30 italic tracking-wide">
              items not yet tagged
            </span>
          )}
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <span className="item-tag hover:bg-blush/80 transition-colors cursor-pointer">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Vote buttons */}
        {!voted ? (
          <div className="flex gap-2">
            <button
              onClick={() => vote('hot')}
              disabled={loading}
              className="vote-btn-hot flex-1"
            >
              Hot
            </button>
            <button
              onClick={() => vote('not')}
              disabled={loading}
              className="vote-btn-not flex-1"
            >
              Not
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-mono text-smoke tracking-wider uppercase">
              You voted{' '}
              <span className={voted === 'hot' ? 'text-hot' : 'text-not'}>
                {voted}
              </span>
            </span>
            <span className="text-xs font-mono text-smoke/60">
              {hotCount} hot &middot; {notCount} not
            </span>
          </div>
        )}

        {/* Location */}
        {outfit.location && (
          <p className="text-[10px] font-mono text-smoke/40 tracking-wider uppercase mt-3">
            {outfit.location}
          </p>
        )}
      </div>
    </article>
  );
}
