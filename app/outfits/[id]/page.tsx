'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDisplayName } from '@/lib/data';
import itemsData from '@/data/items.json';
import ItemImage from '@/components/ItemImage';
import OutfitInstrument from '@/components/OutfitInstrument';
import type { Outfit, Item } from '@/lib/types';

export const runtime = 'edge';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export default function OutfitPage() {
  const { id } = useParams<{ id: string }>();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [outfitNo, setOutfitNo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);

  const allItems = itemsData as Item[];

  useEffect(() => {
    fetch('/api/outfits')
      .then((r) => r.json())
      .then((data) => data as Outfit[])
      .then((outfits) => {
        const found = outfits.find((o) => o.id === id);
        if (found) {
          setOutfit(found);
          // Chronological catalog number — oldest fit is OUTFIT 001.
          const chrono = [...outfits].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setOutfitNo(chrono.findIndex((o) => o.id === id) + 1);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        <p className="txt-meta opacity-50">Loading…</p>
      </div>
    );
  }

  if (notFound || !outfit) {
    return (
      <div className="max-w-md mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        <Link href="/" className="txt-meta opacity-50 hover:opacity-100 transition-opacity">
          &larr; All Fits
        </Link>
        <div className="mt-8">
          <h2 className="txt-display-solid">Not Found</h2>
          <p className="txt-meta opacity-50 mt-4">This outfit doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const items = outfit.items
    .map((itemId) => allItems.find((i) => i.id === itemId))
    .filter(Boolean) as Item[];

  const stampDate = new Date(outfit.date + 'T12:00:00')
    .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    .replace(/\//g, '·');
  const stampNo = outfitNo !== null ? String(outfitNo).padStart(3, '0') : '—';

  return (
    <div className="max-w-md mx-auto w-full">
      {/* Stamp bar — instrument authority: wordmark + data readout */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '8px var(--pad) 12px' }}
      >
        <Link
          href="/"
          className="hover:opacity-100 transition-opacity"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', opacity: 0.6 }}
        >
          &larr; FULLY FASHIONED
        </Link>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', opacity: 0.6 }}>
          OUTFIT {stampNo} · {stampDate}
        </span>
      </div>

      {/* Full-bleed fit photo — the most expensive element; color lives here */}
      <div className="fit-photo-container" style={{ border: 'none' }}>
        {imgError ? (
          <div className="outfit-img-fallback" style={{ aspectRatio: '3/4' }}>
            <span className="txt-meta opacity-50">{outfit.description || 'Fit'}</span>
          </div>
        ) : (
          <img
            src={outfit.image}
            alt={outfit.description || 'Fit'}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* The line, the prompt, the tap targets, and the verdict bloom */}
      <OutfitInstrument outfit={outfit} />

      {/* Wearing — neutral, no gradient (the gradient is reserved for the verdict) */}
      {items.length > 0 && (
        <section className="relative z-10 w-full" style={{ borderTop: '1px solid var(--color-line)' }}>
          <div style={{ padding: '32px var(--pad)' }}>
            <p className="txt-meta font-semibold uppercase mb-3" style={{ opacity: 0.6 }}>
              Wearing
            </p>
            <div className="flex flex-col">
              {items.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <div className="data-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                    <ItemImage item={item} size="sm" />
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-bold leading-tight tracking-tight">
                        {getDisplayName(item)}
                      </span>
                      <span className="txt-meta uppercase opacity-70">{item.category}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="txt-meta opacity-40">&rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div style={{ padding: '24px var(--pad)' }}>
          <p className="txt-meta opacity-40">Items not yet tagged · votes still count</p>
        </div>
      )}
    </div>
  );
}
