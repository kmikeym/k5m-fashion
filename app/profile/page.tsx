'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import type { Outfit } from '@/lib/types';

export default function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [tallies, setTallies] = useState<Record<string, { hot: number; not: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setLoading(false);
      return;
    }

    // Fetch this user's outfits
    fetch(`/api/outfits?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setOutfits(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch all tallies for scores
    fetch('/api/votes')
      .then((r) => r.json())
      .then((data) => setTallies(data as Record<string, { hot: number; not: number }>))
      .catch(() => {});
  }, [isSignedIn, user]);

  if (!isLoaded) return null;

  return (
    <section
      className="relative z-10 w-full"
      style={{
        background: 'var(--grad-cool)',
        borderTop: '1px solid var(--color-text)',
      }}
    >
      <div
        className="max-w-3xl mx-auto w-full"
        style={{ padding: '64px var(--pad)' }}
      >
        <div className="mb-12">
          <p className="txt-meta mb-4">Your Closet</p>
          <h2 className="txt-display-outline">Your</h2>
          <h3 className="txt-display-solid">Fits</h3>
        </div>

        {!isSignedIn ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-4">Sign in to see your fits</p>
            <SignInButton mode="modal">
              <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : loading ? (
          <p className="txt-meta opacity-50">Loading...</p>
        ) : outfits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-2">
              No fits posted yet. What are you wearing today?
            </p>
            <Link
              href="/post"
              className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity underline"
            >
              Post your first fit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {outfits.map((outfit) => {
              const tally = tallies[outfit.id];
              const total = tally ? tally.hot + tally.not : 0;
              const pct = total > 0 ? Math.round((tally.hot / total) * 100) : null;

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
                    {pct !== null ? (
                      <div
                        className="absolute top-1 right-1 px-1.5 py-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {pct}%
                      </div>
                    ) : (
                      <div
                        className="absolute top-1 right-1 px-1.5 py-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          fontSize: '8px',
                          fontWeight: 500,
                          opacity: 0.6,
                        }}
                      >
                        Waiting for votes...
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
