import { getOutfits, getItemsForOutfit } from '@/lib/data';
import OutfitCard from '@/components/OutfitCard';

export default function Home() {
  const outfits = getOutfits();

  return (
    <>
      {/* Hero — warm gradient */}
      <div
        className="relative z-10"
        style={{
          padding: '0 var(--pad) 24px',
          background: 'var(--grad-warm)',
        }}
      >
        <div className="mb-6">
          <h1 className="txt-display-outline">Daily Fit</h1>
          <h2 className="txt-display-solid">Evaluation</h2>
        </div>
      </div>

      {/* Outfits on warm gradient */}
      {outfits.length === 0 ? (
        <div
          className="relative z-10 text-center"
          style={{
            padding: '80px var(--pad)',
            background: 'var(--grad-warm)',
          }}
        >
          <h2 className="txt-display-outline">No Fits</h2>
          <h3 className="txt-display-solid">Yet</h3>
          <p className="txt-meta opacity-50 mt-4">
            Add outfits to data/outfits.json
          </p>
        </div>
      ) : (
        outfits.map((outfit) => (
          <div
            key={outfit.id}
            style={{ background: 'var(--grad-warm)' }}
          >
            <OutfitCard
              outfit={outfit}
              items={getItemsForOutfit(outfit)}
            />
          </div>
        ))
      )}
    </>
  );
}
