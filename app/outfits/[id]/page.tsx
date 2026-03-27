import Link from 'next/link';
import { getOutfit, getOutfits, getItemsForOutfit } from '@/lib/data';
import { notFound } from 'next/navigation';
import OutfitCard from '@/components/OutfitCard';
import ItemImage from '@/components/ItemImage';

export function generateStaticParams() {
  return getOutfits().map((o) => ({ id: o.id }));
}

export default async function OutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const outfit = getOutfit(id);
  if (!outfit) notFound();

  const items = getItemsForOutfit(outfit);
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
                      {item.name}
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
