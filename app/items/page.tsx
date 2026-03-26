import Link from 'next/link';
import { getItems, getOutfitsForItem } from '@/lib/data';

export default function ItemsPage() {
  const items = getItems();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div>
      <h2 className="font-display text-5xl italic text-ink mb-2">Wardrobe</h2>
      <p className="text-smoke font-body text-lg mb-10">
        Every piece in the rotation. Tap to see how it performs.
      </p>

      {categories.map((cat) => (
        <div key={cat} className="mb-10">
          <h3 className="text-[11px] font-mono tracking-[0.2em] uppercase text-smoke/60 mb-4 border-b border-blush/40 pb-2">
            {cat}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items
              .filter((i) => i.category === cat)
              .map((item) => {
                const outfitCount = getOutfitsForItem(item.id).length;
                return (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="group border border-blush/40 bg-white p-3 hover:border-ink/20 transition-colors">
                      <div className="aspect-square bg-blush/20 mb-2 overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                      <p className="text-sm font-body text-ink leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono text-smoke/50 mt-0.5">
                        {outfitCount} outfit{outfitCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-20 border border-dashed border-blush">
          <p className="font-display text-2xl italic text-smoke/50">
            Wardrobe empty
          </p>
          <p className="text-sm text-smoke/40 mt-2 font-mono">
            Add items to data/items.json
          </p>
        </div>
      )}
    </div>
  );
}
