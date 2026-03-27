import Link from 'next/link';
import { getItems, getOutfitsForItem, getDisplayName } from '@/lib/data';
import ItemImage from '@/components/ItemImage';
import RetiredToggle from '@/components/RetiredToggle';
import type { Item } from '@/lib/types';

function ItemCard({ item }: { item: Item }) {
  const outfitCount = getOutfitsForItem(item.id).length;

  return (
    <Link href={`/items/${item.id}`}>
      <div className="flex flex-col gap-2">
        <ItemImage item={item} size="md" />
        <div>
          <span className="text-sm font-bold leading-tight tracking-tight block">
            {getDisplayName(item)}
          </span>
          {item.brand && (
            <span className="txt-meta opacity-40 block">{item.brand}</span>
          )}
          <span className="txt-meta uppercase opacity-50 block mt-0.5">
            {outfitCount} outfit{outfitCount !== 1 ? 's' : ''}
          </span>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.map((tag) => (
                <span key={tag} className="status-badge opacity-50">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ItemSection({
  items,
  categories,
  grouped,
}: {
  items: Item[];
  categories: string[];
  grouped: boolean;
}) {
  if (items.length === 0) return null;

  if (grouped) {
    return (
      <>
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} className="mb-8">
              <p className="txt-meta font-semibold uppercase opacity-60 mb-3">{cat}</p>
              <div className="item-card-grid">
                {catItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="item-card-grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function ItemsPage() {
  const allItems = getItems();
  const categories = [...new Set(allItems.map((i) => i.category))];

  const packed = allItems.filter((i) => i.status === 'packed');
  const owned = allItems.filter((i) => i.status === 'owned');
  const wishlist = allItems.filter((i) => i.status === 'wishlist');
  const retired = allItems.filter((i) => i.status === 'retired');

  return (
    <>
      {/* The Closet — packed items */}
      <section
        className="relative z-10 w-full"
        style={{
          background: 'var(--grad-warm)',
          borderTop: '1px solid var(--color-text)',
        }}
      >
        <div className="max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
          <div className="mb-8">
            <p className="txt-meta mb-4">Currently With Me</p>
            <h2 className="txt-display-outline">The</h2>
            <h3 className="txt-display-solid">Closet</h3>
          </div>

          {packed.length > 0 ? (
            <ItemSection items={packed} categories={categories} grouped={false} />
          ) : (
            <p className="txt-meta opacity-40">Nothing packed yet</p>
          )}
        </div>
      </section>

      {/* The Wardrobe — owned items */}
      <section
        className="relative z-10 w-full"
        style={{
          background: 'var(--grad-cool)',
          borderTop: '1px solid var(--color-text)',
        }}
      >
        <div className="max-w-3xl mx-auto w-full" style={{ padding: '64px var(--pad)' }}>
          <div className="mb-8">
            <p className="txt-meta mb-4">Full Inventory</p>
            <h2 className="txt-display-outline">The</h2>
            <h3 className="txt-display-solid">Wardrobe</h3>
          </div>

          {owned.length > 0 ? (
            <ItemSection items={owned} categories={categories} grouped={true} />
          ) : (
            <p className="txt-meta opacity-40">No items in wardrobe</p>
          )}
        </div>
      </section>

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <section
          className="relative z-10 w-full"
          style={{ borderTop: '1px solid var(--color-text)' }}
        >
          <div className="max-w-3xl mx-auto w-full" style={{ padding: '48px var(--pad)' }}>
            <div className="mb-8">
              <p className="txt-meta mb-4">Want List</p>
              <h2 className="txt-display-outline">On the</h2>
              <h3 className="txt-display-solid">Radar</h3>
            </div>

            <ItemSection items={wishlist} categories={categories} grouped={false} />
          </div>
        </section>
      )}

      {/* Retired items — toggle */}
      {retired.length > 0 && (
        <RetiredToggle>
          <section
            className="relative z-10 w-full"
            style={{ borderTop: '1px solid var(--color-line)' }}
          >
            <div className="max-w-3xl mx-auto w-full" style={{ padding: '48px var(--pad)' }}>
              <div className="mb-8 opacity-50">
                <p className="txt-meta mb-4">No Longer Active</p>
                <h2 className="txt-display-outline">Retired</h2>
              </div>

              <div className="opacity-50">
                <ItemSection items={retired} categories={categories} grouped={false} />
              </div>
            </div>
          </section>
        </RetiredToggle>
      )}
    </>
  );
}
