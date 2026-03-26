'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import outfitsData from '@/data/outfits.json';
import type { Outfit } from '@/lib/types';

interface VoteRecord {
  outfit_id: string;
  vote: 'hot' | 'not';
  created_at: string;
}

export default function MyVotesPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [myVotes, setMyVotes] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const allOutfits = outfitsData as Outfit[];

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    fetch('/api/votes?mine=true')
      .then((r) => r.json())
      .then((data) => {
        setMyVotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isSignedIn]);

  const hotVotes = myVotes.filter((v) => v.vote === 'hot').length;
  const notVotes = myVotes.filter((v) => v.vote === 'not').length;

  if (!isLoaded) return null;

  return (
    <section
      className="relative z-10 w-full"
      style={{
        background: 'var(--grad-cool)',
        borderTop: '1px solid var(--color-text)',
      }}
    >
      <div className="max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        <div className="mb-12">
          <p className="txt-meta mb-4">Your History</p>
          <h2 className="txt-display-outline">My</h2>
          <h3 className="txt-display-solid">Votes</h3>
        </div>

        {!isSignedIn ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-4">Sign in to see your vote history</p>
            <SignInButton mode="modal">
              <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : loading ? (
          <p className="txt-meta opacity-50">Loading...</p>
        ) : myVotes.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="txt-display-outline">No Votes</h2>
            <h3 className="txt-display-solid">Yet</h3>
            <p className="txt-meta opacity-50 mt-4">
              <Link href="/" className="underline hover:opacity-70">
                Go rate some outfits
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex gap-8 mb-12">
              <div>
                <span className="metric-val">{myVotes.length}</span>
                <p className="txt-meta font-semibold uppercase mt-1">Total</p>
              </div>
              <div>
                <span className="metric-val">{hotVotes}</span>
                <p className="txt-meta font-semibold uppercase mt-1">Hot</p>
              </div>
              <div>
                <span className="metric-val outline">{notVotes}</span>
                <p className="txt-meta font-semibold uppercase mt-1">Not</p>
              </div>
            </div>

            {/* Vote grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {myVotes.map((v) => {
                const outfit = allOutfits.find((o) => o.id === v.outfit_id);
                if (!outfit) return null;

                return (
                  <Link
                    key={v.outfit_id}
                    href={`/outfits/${v.outfit_id}`}
                    className="relative group"
                  >
                    <div className="aspect-[3/4] overflow-hidden border border-ink/10">
                      <img
                        src={outfit.image}
                        alt={outfit.description || 'Outfit'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div
                        className="absolute bottom-1 right-1 px-1.5 py-0.5"
                        style={{
                          background: v.vote === 'hot' ? 'var(--color-text)' : 'rgba(255,255,255,0.85)',
                          color: v.vote === 'hot' ? '#fff' : 'var(--color-text)',
                          fontSize: '8px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {v.vote}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
