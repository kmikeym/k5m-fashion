'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import type { Outfit, Item } from '@/lib/types';
import { getDisplayName } from '@/lib/data';

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
  const { isSignedIn, isLoaded } = useUser();
  const [voted, setVoted] = useState<'hot' | 'not' | null>(null);
  const [hotCount, setHotCount] = useState(0);
  const [notCount, setNotCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetch(`/api/votes?outfit_id=${outfit.id}`)
      .then((r) => r.json())
      .then((data) => data as { hot?: number; not?: number; myVote?: 'hot' | 'not' })
      .then((data) => {
        setHotCount(data.hot || 0);
        setNotCount(data.not || 0);
        if (data.myVote) setVoted(data.myVote);
      })
      .catch(() => {});
  }, [outfit.id]);

  async function vote(choice: 'hot' | 'not') {
    if (voted || loading) return;
    setLoading(true);
    setVoteError(false);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_id: outfit.id,
          vote: choice === 'hot' ? 1 : 0,
        }),
      });

      if (res.ok || res.status === 409) {
        setVoted(choice);
        if (res.ok) {
          if (choice === 'hot') setHotCount((c) => c + 1);
          else setNotCount((c) => c + 1);
        }
        setLoading(false);
        window.dispatchEvent(new CustomEvent('outfit-voted'));
        return;
      }

      // Non-OK, non-409 response
      setVoteError(true);
      setTimeout(() => setVoteError(false), 4000);
    } catch {
      setVoteError(true);
      setTimeout(() => setVoteError(false), 4000);
    }

    setLoading(false);
  }

  const total = hotCount + notCount;
  const hotPct = total > 0 ? Math.round((hotCount / total) * 100) : null;

  return (
    <div className="relative z-10">
      {/* Photo with tags */}
      <div style={{ padding: '0 var(--pad)' }}>
        <Link href={`/outfits/${outfit.id}`}>
          <div className="fit-photo-container">
            {imgError ? (
              <div className="outfit-img-fallback" style={{ aspectRatio: '3/4' }}>
                <span className="txt-display-outline" style={{ fontSize: 24 }}>
                  {new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ) : (
              <img
                src={outfit.image}
                alt={outfit.description || 'Outfit'}
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
            {/* Score badge */}
            {hotPct !== null && (
              <div className="absolute top-3 right-3 bg-white/90 px-2 py-1">
                <span className="txt-meta font-bold">{hotPct}% Hot</span>
              </div>
            )}
          </div>
        </Link>

        {/* Description */}
        {(outfit.description || outfit.location) && (
          <div className="mt-3 mb-4">
            {outfit.description && (
              <p className="text-sm font-medium">{outfit.description}</p>
            )}
            {outfit.location && (
              <p className="txt-meta opacity-50 mt-1">{outfit.location}</p>
            )}
          </div>
        )}

        {/* Vote results bar (when voted or just viewing) */}
        {total > 0 && voted && (
          <div className="mb-4">
            <div className="flex h-2 overflow-hidden" style={{ border: '1px solid var(--color-text)' }}>
              <div
                className="bg-ink transition-all duration-500"
                style={{ width: `${hotPct}%` }}
              />
              <div
                className="bg-transparent transition-all duration-500"
                style={{ width: `${100 - (hotPct || 0)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="txt-meta opacity-50">{hotPct}% Hot</span>
              <span className="txt-meta opacity-50">{total} vote{total !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vote error */}
      {voteError && (
        <div className="text-center" style={{ padding: '8px var(--pad)' }}>
          <span className="txt-meta opacity-60">Couldn&apos;t save vote — try again</span>
        </div>
      )}

      {/* Vote buttons */}
      {!isLoaded ? null : showVoting && !isSignedIn ? (
        <div
          className="relative z-10 text-center"
          style={{
            padding: '20px var(--pad)',
            borderTop: '1px solid var(--color-text)',
            borderBottom: '1px solid var(--color-text)',
          }}
        >
          <SignInButton mode="modal">
            <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
              Sign in to vote
            </button>
          </SignInButton>
        </div>
      ) : showVoting && !voted ? (
        <div className="voting-actions">
          <button
            onClick={() => vote('not')}
            disabled={loading}
            className="vote-action-btn is-not"
          >
            <span className="txt-meta font-semibold uppercase mb-2">
              Cast Vote
            </span>
            <span className="txt-massive">NOT</span>
          </button>
          <button
            onClick={() => vote('hot')}
            disabled={loading}
            className="vote-action-btn"
          >
            <span className="txt-meta font-semibold uppercase mb-2">
              Cast Vote
            </span>
            <span className="txt-massive">HOT</span>
          </button>
        </div>
      ) : showVoting && voted ? (
        <div
          className="flex items-center justify-between relative z-10"
          style={{
            padding: '16px var(--pad)',
            borderTop: '1px solid var(--color-text)',
            borderBottom: '1px solid var(--color-text)',
          }}
        >
          <span className="txt-meta font-semibold uppercase">
            You voted{' '}
            <span className={voted === 'hot' ? 'font-bold' : 'opacity-60'}>
              {voted}
            </span>
          </span>
          <span className="txt-meta opacity-50">
            {hotCount} hot &middot; {notCount} not
          </span>
        </div>
      ) : null}
    </div>
  );
}
