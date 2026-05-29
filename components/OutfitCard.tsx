'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Outfit, Item } from '@/lib/types';
import { getDisplayName } from '@/lib/data';
import { useDeviceToken } from '@/lib/useDeviceToken';
import { MIN_VOTES } from '@/lib/verdict';

interface OutfitCardProps {
  outfit: Outfit;
  items: Item[];
  showVoting?: boolean;
}

export default function OutfitCard({
  outfit,
  items,
  showVoting = true,
}: OutfitCardProps) {
  const token = useDeviceToken();
  const [voted, setVoted] = useState<'hot' | 'not' | null>(null);
  // THE ROOM is frozen at load (Law 3) — the user's tap never moves the displayed %.
  const [hotCount, setHotCount] = useState(0);
  const [notCount, setNotCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const q = token ? `&token=${encodeURIComponent(token)}` : '';
    fetch(`/api/votes?outfit_id=${outfit.id}${q}`)
      .then((r) => r.json())
      .then((data) => data as { hot?: number; not?: number; myVote?: 'hot' | 'not' })
      .then((data) => {
        setHotCount(data.hot || 0);
        setNotCount(data.not || 0);
        if (data.myVote) setVoted(data.myVote);
      })
      .catch(() => {});
  }, [outfit.id, token]);

  async function vote(choice: 'hot' | 'not') {
    if (voted || loading) return;
    setLoading(true);
    setVoteError(false);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit_id: outfit.id, vote: choice === 'hot' ? 1 : 0, token }),
      });
      // No login required — anonymous device token is the vote identity.
      if (res.ok || res.status === 409) {
        setVoted(choice); // Law 3: do not increment the displayed room average.
        setLoading(false);
        window.dispatchEvent(new CustomEvent('outfit-voted'));
        return;
      }
      setVoteError(true);
      setTimeout(() => setVoteError(false), 4000);
    } catch {
      setVoteError(true);
      setTimeout(() => setVoteError(false), 4000);
    }
    setLoading(false);
  }

  const total = hotCount + notCount;
  const roomHasData = total >= MIN_VOTES;
  const hotPct = total > 0 ? Math.round((hotCount / total) * 100) : null;

  return (
    <div className="relative z-10">
      {/* Photo with tags */}
      <div style={{ padding: '0 var(--pad)' }}>
        <Link href={`/outfits/${outfit.id}`}>
          <div className="fit-photo-container">
            {imgError ? (
              <div className="outfit-img-fallback" style={{ aspectRatio: '3/4' }}>
                <span className="txt-meta opacity-50">
                  {new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ) : (
              <img
                src={outfit.image}
                alt={outfit.description || 'Fit'}
                onError={() => setImgError(true)}
              />
            )}
            {/* Date badge */}
            <div className="absolute top-3 left-3">
              <span className="photo-tag">
                {new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 flex flex-col gap-1">
              {items.length === 0 ? (
                <span className="photo-tag" style={{ opacity: 0.5 }}>
                  Items not yet tagged
                </span>
              ) : (
                items.map((item) => (
                  <span key={item.id} className="photo-tag">
                    {getDisplayName(item)}
                  </span>
                ))
              )}
            </div>
            {/* Score badge — only once the room has a settled reading (Law 7) */}
            {roomHasData && hotPct !== null && (
              <div className="absolute top-3 right-3 bg-white/90 px-2 py-1">
                <span className="txt-meta font-bold" style={{ color: 'var(--color-ground)' }}>
                  {hotPct}% HIT
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Description */}
        {(outfit.description || outfit.location) && (
          <div className="mt-3 mb-4">
            {outfit.description && <p className="text-sm font-medium">{outfit.description}</p>}
            {outfit.location && <p className="txt-meta opacity-50 mt-1">{outfit.location}</p>}
          </div>
        )}
      </div>

      {/* Vote error */}
      {voteError && (
        <div className="text-center" style={{ padding: '8px var(--pad)' }}>
          <span className="txt-meta opacity-60">Couldn&apos;t save vote — try again</span>
        </div>
      )}

      {/* Vote — no login required. Hit / Miss, then route to the full verdict. */}
      {!showVoting ? null : !voted ? (
        <div className="vote-btn-row">
          <button
            onClick={() => vote('not')}
            disabled={loading || token === null}
            className="vote-btn font-bold uppercase"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.06em' }}
            aria-label="Vote Miss"
          >
            Miss
          </button>
          <button
            onClick={() => vote('hot')}
            disabled={loading || token === null}
            className="vote-btn font-bold uppercase"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.06em' }}
            aria-label="Vote Hit"
          >
            Hit
          </button>
        </div>
      ) : (
        <div className="score-display">
          <p className="txt-meta font-semibold uppercase" style={{ letterSpacing: '0.08em' }}>
            You said {voted === 'hot' ? 'HIT' : 'MISS'}
          </p>
          <Link
            href={`/outfits/${outfit.id}`}
            className="inline-block mt-2 txt-meta font-bold uppercase"
            style={{ letterSpacing: '0.08em', textDecoration: 'underline' }}
          >
            See the full verdict &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
