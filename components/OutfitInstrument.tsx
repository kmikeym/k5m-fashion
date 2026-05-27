'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import type { Outfit } from '@/lib/types';
import { getVerdict } from '@/lib/verdict';

interface OutfitInstrumentProps {
  outfit: Outfit;
}

/**
 * The voting half of the outfit screen (#15) — the line + prompt, the HOT/NOT
 * tap targets, and the verdict bloom that lands after a vote. This is where
 * ~80% of arrivals meet the product, so the vote is one tap and the reward is
 * watching the reading fill in.
 */
export default function OutfitInstrument({ outfit }: OutfitInstrumentProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [voted, setVoted] = useState<'hot' | 'not' | null>(null);
  const [hot, setHot] = useState(0);
  const [not, setNot] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState(false);
  const [bloomIn, setBloomIn] = useState(false);

  useEffect(() => {
    fetch(`/api/votes?outfit_id=${outfit.id}`)
      .then((r) => r.json())
      .then((data) => data as { hot?: number; not?: number; myVote?: 'hot' | 'not' })
      .then((data) => {
        setHot(data.hot || 0);
        setNot(data.not || 0);
        if (data.myVote) setVoted(data.myVote);
      })
      .catch(() => {});
  }, [outfit.id]);

  // Trigger the bloom animation once a verdict is showing.
  useEffect(() => {
    if (voted) {
      const t = setTimeout(() => setBloomIn(true), 60);
      return () => clearTimeout(t);
    }
  }, [voted]);

  async function vote(choice: 'hot' | 'not') {
    if (voted || loading) return;
    setLoading(true);
    setVoteError(false);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit_id: outfit.id, vote: choice === 'hot' ? 1 : 0 }),
      });

      if (res.ok || res.status === 409) {
        // 409 = already voted in a past session; reveal the verdict either way.
        if (res.ok) {
          if (choice === 'hot') setHot((c) => c + 1);
          else setNot((c) => c + 1);
        }
        setVoted(choice);
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

  const verdict = getVerdict(hot, not, outfit.id);
  const isPredictive = verdict.state === 'predictive';
  const pct = verdict.pct ?? 0;

  // --- Verdict bloom (after voting) ---
  if (voted) {
    return (
      <div
        className="relative z-10"
        style={{
          background: verdict.isHot ? 'var(--grad-warm)' : 'var(--grad-cool)',
          color: 'var(--color-ground)',
          padding: '40px var(--pad) 48px',
          borderTop: '1px solid var(--color-line)',
          opacity: bloomIn ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        <p
          className="txt-meta font-semibold uppercase"
          style={{ letterSpacing: '0.14em', opacity: 0.7 }}
        >
          {isPredictive ? 'Predictive Analysis · Not Enough Data' : 'The Verdict'}
        </p>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="txt-massive">
            {isPredictive ? '~' : ''}{pct}%
          </span>
          <span
            className="font-bold uppercase"
            style={{ fontSize: 20, letterSpacing: '0.04em' }}
          >
            {verdict.isHot ? 'Hot' : 'Not'}
          </span>
        </div>

        {/* Animated fill — the reward for voting is watching the reading land. */}
        <div
          style={{
            height: 8,
            width: '100%',
            background: 'rgba(13,13,13,0.14)',
            marginTop: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: bloomIn ? `${pct}%` : '0%',
              background: 'var(--color-ground)',
              transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>

        <p className="txt-meta mt-3" style={{ opacity: 0.65 }}>
          {isPredictive
            ? `Projected from ${verdict.n} vote${verdict.n !== 1 ? 's' : ''} · firms up at 5`
            : `${verdict.n} vote${verdict.n !== 1 ? 's' : ''}`}
        </p>
      </div>
    );
  }

  // --- Pre-vote: the line, the prompt, and the tap targets ---
  return (
    <div className="relative z-10">
      <div style={{ padding: '28px var(--pad) 20px' }}>
        <p className="txt-display-solid" style={{ fontSize: 28 }}>
          Taste is quantifiable.
        </p>
        <p className="txt-meta uppercase mt-2" style={{ opacity: 0.6, letterSpacing: '0.14em' }}>
          Hot or not?
        </p>
      </div>

      {voteError && (
        <div className="text-center" style={{ padding: '0 var(--pad) 12px' }}>
          <span className="txt-meta" style={{ opacity: 0.6 }}>
            Couldn&apos;t save your vote — try again
          </span>
        </div>
      )}

      {!isLoaded ? (
        <div className="vote-btn-row">
          <div className="vote-btn" style={{ opacity: 0.3 }}>·</div>
        </div>
      ) : !isSignedIn ? (
        <SignInButton mode="modal">
          <button
            className="vote-btn-row w-full cursor-pointer"
            style={{ background: 'transparent' }}
          >
            <span
              className="vote-btn font-bold uppercase"
              style={{ fontSize: 16, letterSpacing: '0.08em', fontWeight: 700 }}
            >
              Sign in &amp; vote
            </span>
          </button>
        </SignInButton>
      ) : (
        <div className="vote-btn-row">
          <button
            onClick={() => vote('not')}
            disabled={loading}
            className="vote-btn font-bold uppercase"
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.06em' }}
            aria-label="Vote not"
          >
            Not
          </button>
          <button
            onClick={() => vote('hot')}
            disabled={loading}
            className="vote-btn font-bold uppercase"
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.06em' }}
            aria-label="Vote hot"
          >
            Hot
          </button>
        </div>
      )}
    </div>
  );
}
