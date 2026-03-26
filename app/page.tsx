import { getOutfits, getItemsForOutfit } from '@/lib/data';
import OutfitCard from '@/components/OutfitCard';

export default function Home() {
  const outfits = getOutfits();

  return (
    <>
      {/* Hero */}
      <div
        className="relative z-10 max-w-3xl mx-auto w-full"
        style={{ padding: '0 var(--pad) 24px' }}
      >
        <div className="mb-6">
          <h1 className="txt-display-outline">Daily Fit</h1>
          <h2 className="txt-display-solid">Evaluation</h2>
        </div>
      </div>

      {/* Outfits */}
      {outfits.length === 0 ? (
        <div
          className="relative z-10 text-center max-w-3xl mx-auto w-full"
          style={{ padding: '80px var(--pad)' }}
        >
          <h2 className="txt-display-outline">No Fits</h2>
          <h3 className="txt-display-solid">Yet</h3>
          <p className="txt-meta opacity-50 mt-4">
            Add outfits to data/outfits.json
          </p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={getItemsForOutfit(outfit)}
            />
          ))}
        </div>
      )}
    </>
  );
}
