import { getOutfits, getItemsForOutfit } from '@/lib/data';
import OutfitCard from '@/components/OutfitCard';

export default function Home() {
  const outfits = getOutfits();

  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <h2 className="font-display text-5xl italic text-ink mb-2">
          'Fit Check
        </h2>
        <p className="text-smoke font-body text-lg max-w-lg">
          Rate the outfit. The data reveals which pieces work &mdash; and which
          ones need to stay in the drawer.
        </p>
      </div>

      {/* Feed */}
      {outfits.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-blush">
          <p className="font-display text-2xl italic text-smoke/50">
            No fits yet
          </p>
          <p className="text-sm text-smoke/40 mt-2 font-mono">
            Add outfits to data/outfits.json
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={getItemsForOutfit(outfit)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
