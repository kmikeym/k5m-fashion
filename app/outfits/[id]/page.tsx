import Link from 'next/link';
import { getOutfit, getOutfits, getItemsForOutfit } from '@/lib/data';
import { notFound } from 'next/navigation';
import OutfitCard from '@/components/OutfitCard';

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
    <div>
      <Link
        href="/"
        className="text-xs font-mono text-smoke/60 tracking-wider uppercase hover:text-ink transition-colors"
      >
        &larr; All Fits
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-[11px] font-mono tracking-wider text-smoke/60 uppercase">
          {formattedDate}
          {outfit.location && <> &middot; {outfit.location}</>}
        </p>
        <h2 className="font-display text-4xl italic text-ink mt-1">
          {outfit.description}
        </h2>
      </div>

      <div className="max-w-lg mx-auto">
        <OutfitCard outfit={outfit} items={items} />
      </div>

      {/* Wearing section */}
      <div className="mt-12">
        <h3 className="text-[11px] font-mono tracking-[0.2em] uppercase text-smoke/60 mb-4 border-b border-blush/40 pb-2">
          Wearing
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="border border-blush/40 bg-white p-3 hover:border-ink/20 transition-colors text-center">
                <div className="aspect-square bg-blush/20 mb-2 overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-xs font-body text-ink">{item.name}</p>
                <p className="text-[10px] font-mono text-smoke/50">
                  {item.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
