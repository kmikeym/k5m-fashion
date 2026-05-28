'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import type { Outfit } from '@/lib/types';
import { useDeviceToken } from '@/lib/useDeviceToken';
import { MIN_VOTES } from '@/lib/verdict';

interface Props {
  outfit: Outfit;
}

interface Instrument {
  score: number;
  revised: boolean;
  asOf: string | null;
}

const REVEAL_DELAY = 750; // Law 2: withhold the beat before the number lands.

/**
 * The verdict half of the outfit screen (#15, 2026-05-28). Two numbers, one gap:
 * THE INSTRUMENT (computed, carries cold-start) beside THE ROOM (crowd HIT-rate,
 * settled-at-reveal). Login-free voting via device token; sign-in is offered after
 * the verdict as a "claim your taste" upgrade. Honors Seshat's seven laws.
 */
export default function OutfitInstrument({ outfit }: Props) {
  const token = useDeviceToken();
  const { isSignedIn } = useUser();

  const [instrument, setInstrument] = useState<Instrument | null>(null);
  // THE ROOM is frozen at load (Law 3): the user's tap never moves this number.
  const [room, setRoom] = useState<{ hot: number; not: number } | null>(null);
  const [myVote, setMyVote] = useState<'hot' | 'not' | null>(null);

  const [charging, setCharging] = useState<'hit' | 'miss' | null>(null);
  const [voted, setVoted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState(false);

  const mergedRef = useRef(false);

  // THE INSTRUMENT — computed, independent of the room, shows even at vote #1.
  useEffect(() => {
    fetch(`/api/instrument?outfit_id=${outfit.id}`)
      .then((r) => r.json())
      .then((d) => setInstrument(d as Instrument))
      .catch(() => {});
  }, [outfit.id]);

  // THE ROOM tally + this device's prior vote (resolved by token or Clerk id).
  useEffect(() => {
    const q = token ? `&token=${encodeURIComponent(token)}` : '';
    fetch(`/api/votes?outfit_id=${outfit.id}${q}`)
      .then((r) => r.json())
      .then((d) => d as { hot?: number; not?: number; myVote?: 'hot' | 'not' })
      .then((d) => {
        setRoom({ hot: d.hot || 0, not: d.not || 0 });
        if (d.myVote) {
          setMyVote(d.myVote);
          setVoted(true);
        }
      })
      .catch(() => {});
  }, [outfit.id, token]);

  // Merge anon vote history into the account once, after sign-in.
  useEffect(() => {
    if (isSignedIn && token && !mergedRef.current) {
      mergedRef.current = true;
      fetch('/api/votes/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  }, [isSignedIn, token]);

  useEffect(() => {
    if (voted) {
      const t = setTimeout(() => setRevealed(true), REVEAL_DELAY);
      return () => clearTimeout(t);
    }
  }, [voted]);

  async function vote(choice: 'hit' | 'miss') {
    if (voted || loading) return;
    setLoading(true);
    setVoteError(false);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit_id: outfit.id, vote: choice === 'hit' ? 1 : 0, token }),
      });
      if (res.ok || res.status === 409) {
        setMyVote(choice === 'hit' ? 'hot' : 'not');
        setVoted(true);
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

  // --- Derived readings ---
  const roomTotal = room ? room.hot + room.not : 0;
  const roomHasData = roomTotal >= MIN_VOTES;
  const roomRate = roomTotal > 0 ? room!.hot / roomTotal : null;
  const roomScore = roomRate != null ? Math.round(roomRate * 100) / 10 : null; // /10, 1 dp
  const roomPct = roomRate != null ? Math.round(roomRate * 100) : null;
  const instScore = instrument ? instrument.score : null;
  // Color is the reading (Law 6): the room when it has data, else the instrument's lean.
  const isHit = roomHasData ? roomRate! >= 0.5 : instScore != null ? instScore >= 5 : true;

  let gapLine = '';
  if (roomHasData && instScore != null && roomScore != null) {
    const diff = instScore - roomScore;
    gapLine =
      Math.abs(diff) < 0.5
        ? 'The instrument and the room agree.'
        : diff > 0
        ? 'The instrument rates this above the room.'
        : 'The room rates this above the instrument.';
  } else if (instScore != null) {
    gapLine = 'Not enough votes yet — the instrument is holding the line.';
  }

  // ===== Verdict bloom (after voting) =====
  if (voted) {
    return (
      <div
        className="relative z-10"
        style={{
          background: isHit ? 'var(--grad-warm)' : 'var(--grad-cool)',
          color: 'var(--color-ground)',
          padding: '36px var(--pad) 44px',
          borderTop: '1px solid var(--color-line)',
          opacity: revealed ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Two numbers, side by side on a shared /10 scale */}
        <div className="flex items-start justify-between" style={{ gap: 16 }}>
          <Reading
            label="The Instrument"
            value={instScore != null ? instScore.toFixed(1) : '—'}
            sub={
              instrument?.revised
                ? `revised · as of ${instrument.asOf}`
                : 'computed from the pieces'
            }
            revealed={revealed}
          />
          <Reading
            label="The Room"
            value={roomHasData ? roomScore!.toFixed(1) : 'N/A'}
            sub={
              roomHasData
                ? `${roomPct}% HIT · n=${roomTotal}`
                : `NOT ENOUGH DATA · n=${roomTotal}`
            }
            align="right"
            revealed={revealed}
            muted={!roomHasData}
          />
        </div>

        {/* Spectrum: locate both numbers against each other (Law 5) */}
        <div style={{ position: 'relative', height: 2, background: 'rgba(13,13,13,0.18)', marginTop: 22 }}>
          {instScore != null && <Tick pos={instScore / 10} revealed={revealed} solid />}
          {roomHasData && roomScore != null && <Tick pos={roomScore / 10} revealed={revealed} />}
        </div>
        <div className="flex justify-between" style={{ marginTop: 6 }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, opacity: 0.5 }}>0</span>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, opacity: 0.5 }}>10</span>
        </div>

        {/* The gap — the payoff, not decoration */}
        {gapLine && (
          <p className="mt-5" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, maxWidth: '22em' }}>
            {gapLine}
          </p>
        )}

        <p className="txt-meta mt-2" style={{ opacity: 0.6 }}>
          You said {myVote === 'hot' ? 'HIT' : 'MISS'}.
        </p>

        {/* Login = claim your taste, only after the verdict */}
        {!isSignedIn && (
          <div className="mt-5" style={{ borderTop: '1px solid rgba(13,13,13,0.15)', paddingTop: 16 }}>
            <SignInButton mode="modal">
              <button
                className="font-bold uppercase cursor-pointer"
                style={{ fontSize: 12, letterSpacing: '0.08em', textDecoration: 'underline' }}
              >
                Claim your taste &rarr;
              </button>
            </SignInButton>
            <p className="txt-meta mt-1" style={{ opacity: 0.6 }}>
              Keep your votes, see where you stand vs the room, get pinged when a score moves.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ===== Pre-vote: the line, the prompt, the tap targets =====
  return (
    <div className="relative z-10">
      <div style={{ padding: '28px var(--pad) 18px' }}>
        <p className="txt-display-solid" style={{ fontSize: 28 }}>
          Taste is quantifiable.
        </p>
        <p className="txt-meta uppercase mt-2" style={{ opacity: 0.6, letterSpacing: '0.14em' }}>
          Hit or miss?
        </p>
      </div>

      {voteError && (
        <div className="text-center" style={{ padding: '0 var(--pad) 12px' }}>
          <span className="txt-meta" style={{ opacity: 0.6 }}>
            Couldn&apos;t save your vote — try again
          </span>
        </div>
      )}

      <div className="vote-btn-row">
        <PressButton
          label="Miss"
          charging={charging === 'miss'}
          disabled={loading}
          onDown={() => setCharging('miss')}
          onCancel={() => !loading && setCharging(null)}
          onCommit={() => vote('miss')}
        />
        <PressButton
          label="Hit"
          charging={charging === 'hit'}
          disabled={loading}
          onDown={() => setCharging('hit')}
          onCancel={() => !loading && setCharging(null)}
          onCommit={() => vote('hit')}
        />
      </div>
    </div>
  );
}

// One number in the dual readout.
function Reading({
  label,
  value,
  sub,
  align = 'left',
  revealed,
  muted = false,
}: {
  label: string;
  value: string;
  sub: string;
  align?: 'left' | 'right';
  revealed: boolean;
  muted?: boolean;
}) {
  return (
    <div style={{ textAlign: align, opacity: muted ? 0.55 : 1 }}>
      <p className="txt-meta font-semibold uppercase" style={{ letterSpacing: '0.12em', opacity: 0.7 }}>
        {label}
      </p>
      <span
        className="txt-massive"
        style={{
          display: 'inline-block',
          fontVariantNumeric: 'tabular-nums',
          transform: revealed ? 'translateY(0)' : 'translateY(6px)',
          opacity: revealed ? 1 : 0,
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {value}
      </span>
      <p className="txt-meta" style={{ opacity: 0.7 }}>
        {sub}
      </p>
    </div>
  );
}

// A marker on the shared /10 spectrum.
function Tick({ pos, revealed, solid = false }: { pos: number; revealed: boolean; solid?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: -4,
        left: `${Math.max(0, Math.min(1, pos)) * 100}%`,
        width: 2,
        height: 10,
        background: 'var(--color-ground)',
        opacity: revealed ? (solid ? 1 : 0.5) : 0,
        transform: 'translateX(-1px)',
        transition: 'opacity 0.6s ease 0.2s',
      }}
    />
  );
}

// A HIT/MISS button that charges on press-down (Law 1) and commits on release.
function PressButton({
  label,
  charging,
  disabled,
  onDown,
  onCancel,
  onCommit,
}: {
  label: string;
  charging: boolean;
  disabled: boolean;
  onDown: () => void;
  onCancel: () => void;
  onCommit: () => void;
}) {
  return (
    <button
      className="vote-btn font-bold uppercase"
      style={{ position: 'relative', overflow: 'hidden', fontSize: 22, fontWeight: 700, letterSpacing: '0.06em' }}
      disabled={disabled}
      onPointerDown={onDown}
      onPointerLeave={onCancel}
      onPointerCancel={onCancel}
      onClick={onCommit}
      aria-label={`Vote ${label}`}
    >
      {/* The charge: a fill rising from the bottom while pressed. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: charging ? '100%' : '0%',
          background: 'rgba(244,244,242,0.10)',
          transition: 'height 0.45s ease',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative' }}>{label}</span>
    </button>
  );
}
