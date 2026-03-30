'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDisplayName } from '@/lib/data';
import itemsData from '@/data/items.json';
import OutfitCard from '@/components/OutfitCard';
import ItemImage from '@/components/ItemImage';
import type { Outfit, Item } from '@/lib/types';

export const runtime = 'edge';

export default function OutfitPage() {
  const { id } = useParams<{ id: string }>();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const allItems = itemsData as Item[];

  useEffect(() => {
    fetch('/api/outfits')
      .then((r) => r.json())
      .then((data) => data as Outfit[])
      .then((outfits) => {
        const found = outfits.find((o) => o.id === id);
        if (found) {
          setOutfit(found);
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
      <div className="relative z-10 max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        <p className="txt-meta opacity-50">Loading...</p>
      </div>
    );
  }

  if (notFound || !outfit) {
    return (
      <div className="relative z-10 max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
        <Link href="/" className="txt-meta opacity-50 hover:opacity-100 transition-opacity">
          &larr; All Fits
        </Link>
        <div className="mt-8 text-center">
          <h2 className="txt-display-outline">Not</h2>
          <h3 className="txt-display-solid">Found</h3>
          <p className="txt-meta opacity-50 mt-4">This outfit doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const items = outfit.items
    .map((itemId) => allItems.find((i) => i.id === itemId))
    .filter(Boolean) as Item[];

  const formattedDate = new Date(outfit.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      {/* Header */}
      <div
        className="relative z-10 max-w-3xl mx-auto w-full"
        style={{ padding: '0 var(--pad) 16px' }}
      >
        <Link
          href="/"
          className="txt-meta opacity-50 hover:opacity-100 transition-opacity"
        >
          &larr; All Fits
        </Link>

        <div className="mt-4">
          <p className="txt-meta opacity-60">{formattedDate}</p>
          <h2 className="txt-display-solid mt-1">{outfit.description}</h2>
        </div>
      </div>

      {/* Outfit card */}
      <div className="max-w-3xl mx-auto w-full">
        <OutfitCard outfit={outfit} items={items} />
      </div>

      {/* Wearing section on cool gradient */}
      <section
        className="relative z-10 w-full"
        style={{
          background: 'var(--grad-cool)',
          borderTop: '1px solid var(--color-text)',
        }}
      >
        <div className="max-w-3xl mx-auto w-full" style={{ padding: '48px var(--pad)' }}>
          <p className="txt-meta font-semibold uppercase opacity-60 mb-4">
            Wearing
          </p>
          <div className="flex flex-col">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <div className="data-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                  <ItemImage item={item} size="sm" />
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold leading-tight tracking-tight">
                      {getDisplayName(item)}
                    </span>
                    <span className="txt-meta uppercase opacity-70">
                      {item.category}
                    </span>
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
    </>
  );
}
