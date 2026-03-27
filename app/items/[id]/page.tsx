import Link from 'next/link';
import { getItem, getItems, getOutfitsForItem, getItemsForOutfit } from '@/lib/data';
import { notFound } from 'next/navigation';
import OutfitCard from '@/components/OutfitCard';
import ItemImage from '@/components/ItemImage';

export function generateStaticParams() {
  return getItems().map((item) => ({ id: item.id }));
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const outfits = getOutfitsForItem(id);

  return (
    <>
      {/* Header on cool gradient */}
      <section
        className="relative z-10 w-full"
        style={{
          background: 'var(--grad-cool)',
          borderTop: '1px solid var(--color-text)',
        }}
      >
      <div className="max-w-3xl mx-auto w-full" style={{ padding: '48px var(--pad) 32px' }}>
        <Link
          href="/items"
          className="txt-meta opacity-50 hover:opacity-100 transition-opacity"
        >
          &larr; Wardrobe
        </Link>

        <div className="mt-6 mb-6">
          <ItemImage item={item} size="lg" />
        </div>

        <div>
          <p className="txt-meta uppercase opacity-60 mb-2">{item.category}</p>
          <h2 className="txt-display-solid">{item.name}</h2>
          <p className="txt-meta opacity-50 mt-2">
            Appears in {outfits.length} outfit{outfits.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      </section>

      {/* Outfits */}
      {outfits.length > 0 ? (
        outfits.map((outfit) => (
          <div key={outfit.id} className="max-w-3xl mx-auto w-full">
            <OutfitCard
              outfit={outfit}
              items={getItemsForOutfit(outfit)}
            />
          </div>
        ))
      ) : (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '80px var(--pad)' }}
        >
          <p className="txt-meta opacity-50">No outfits yet with this item</p>
        </div>
      )}
    </>
  );
}
