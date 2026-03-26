import Link from 'next/link';
import { getItem, getItems, getOutfitsForItem, getItemsForOutfit } from '@/lib/data';
import { notFound } from 'next/navigation';
import OutfitCard from '@/components/OutfitCard';

export function generateStaticParams() {
  return getItems().map((item) => ({ id: item.id }));
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const outfits = getOutfitsForItem(id);

  return (
    <div>
      <Link
        href="/items"
        className="text-xs font-mono text-smoke/60 tracking-wider uppercase hover:text-ink transition-colors"
      >
        &larr; Wardrobe
      </Link>

      <div className="mt-6 mb-10">
        <span className="item-tag mb-2 inline-block">{item.category}</span>
        <h2 className="font-display text-4xl italic text-ink">{item.name}</h2>
        <p className="text-smoke font-body mt-1">
          Appears in {outfits.length} outfit{outfits.length !== 1 ? 's' : ''}
        </p>
      </div>

      {outfits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={getItemsForOutfit(outfit)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-blush">
          <p className="font-display text-xl italic text-smoke/50">
            No outfits yet with this item
          </p>
        </div>
      )}
    </div>
  );
}
