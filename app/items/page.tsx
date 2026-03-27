import Link from 'next/link';
import { getItems, getOutfitsForItem } from '@/lib/data';
import ItemImage from '@/components/ItemImage';

export default function ItemsPage() {
  const items = getItems();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <section
      className="relative z-10 flex flex-col w-full"
      style={{
        background: 'var(--grad-cool)',
        borderTop: '1px solid var(--color-text)',
      }}
    >
    <div className="max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
      <div className="mb-12">
        <p className="txt-meta mb-4">Full Inventory</p>
        <h2 className="txt-display-outline">The</h2>
        <h3 className="txt-display-solid">Wardrobe</h3>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <p className="txt-meta font-semibold uppercase opacity-60 mb-3">
            {cat}
          </p>
          <div className="flex flex-col">
            {items
              .filter((i) => i.category === cat)
              .map((item) => {
                const outfitCount = getOutfitsForItem(item.id).length;
                return (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="data-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                      <ItemImage item={item} size="sm" />
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold leading-tight tracking-tight">
                          {item.name}
                        </span>
                        <span className="txt-meta uppercase opacity-70">
                          {outfitCount} outfit{outfitCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="txt-meta opacity-40">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="py-16">
          <h2 className="txt-display-outline">Empty</h2>
          <h3 className="txt-display-solid">Closet</h3>
          <p className="txt-meta opacity-50 mt-4">
            Add items to data/items.json
          </p>
        </div>
      )}
    </div>
    </section>
  );
}
