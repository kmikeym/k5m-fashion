'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Outfit, Item } from '@/lib/types';

const CATEGORIES = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'hats'] as const;

export default function AdminPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editingOutfit, setEditingOutfit] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('tops');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then((r) => r.json()),
      import('@/data/outfits.json').then((m) => m.default),
    ]).then(([itemsData, outfitsData]) => {
      setItems(itemsData);
      setOutfits(
        (outfitsData as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    });
  }, []);

  async function refreshItems() {
    const data = await fetch('/api/items').then((r) => r.json());
    setItems(data);
  }

  async function addNewItem() {
    if (!newItemName.trim()) return;
    setSaving(true);

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim(), category: newItemCategory }),
    });

    if (res.ok) {
      await refreshItems();
      setNewItemName('');
      setShowNewItem(false);
    }
    setSaving(false);
  }

  async function toggleItem(outfitId: string, itemId: string) {
    const outfit = outfits.find((o) => o.id === outfitId);
    if (!outfit) return;

    const currentItems = [...outfit.items];
    const idx = currentItems.indexOf(itemId);
    if (idx >= 0) {
      currentItems.splice(idx, 1);
    } else {
      currentItems.push(itemId);
    }

    setSaving(true);
    const res = await fetch(`/api/outfits/${outfitId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: currentItems }),
    });

    if (res.ok) {
      setOutfits((prev) =>
        prev.map((o) => (o.id === outfitId ? { ...o, items: currentItems } : o))
      );
    }
    setSaving(false);
  }

  return (
    <div
      className="relative z-10 max-w-3xl mx-auto w-full"
      style={{ padding: '0 var(--pad) 48px' }}
    >
      <div className="flex justify-between items-baseline mb-8">
        <div>
          <h1 className="txt-display-outline">Admin</h1>
          <h2 className="txt-display-solid">Mode</h2>
        </div>
        <Link href="/" className="txt-meta opacity-50 hover:opacity-100 transition-opacity">
          &larr; Back to feed
        </Link>
      </div>

      {/* New Item Creator */}
      <div className="mb-10" style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '24px' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="txt-meta font-semibold uppercase">
            Items ({items.length})
          </p>
          <button
            onClick={() => setShowNewItem(!showNewItem)}
            className="txt-meta font-bold uppercase hover:opacity-70 transition-opacity"
          >
            {showNewItem ? 'Cancel' : '+ New Item'}
          </button>
        </div>

        {showNewItem && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="txt-meta opacity-50 block mb-1">Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="LA Dodgers Cap"
                className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm font-primary outline-none focus:border-ink"
                onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
              />
            </div>
            <div>
              <label className="txt-meta opacity-50 block mb-1">Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="border border-ink/20 bg-transparent px-3 py-2 text-sm font-primary outline-none focus:border-ink"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addNewItem}
              disabled={saving || !newItemName.trim()}
              className="photo-tag cursor-pointer hover:opacity-70 transition-opacity py-2 px-4"
              style={{ fontSize: '12px' }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Outfit List */}
      {outfits.map((outfit) => {
        const isEditing = editingOutfit === outfit.id;
        const outfitItems = outfit.items || [];
        const formattedDate = new Date(outfit.date + 'T12:00:00').toLocaleDateString(
          'en-US',
          { month: 'short', day: 'numeric', year: 'numeric' }
        );

        return (
          <div
            key={outfit.id}
            style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: '16px', marginBottom: '16px' }}
          >
            {/* Outfit header */}
            <div
              className="flex gap-4 cursor-pointer"
              onClick={() => setEditingOutfit(isEditing ? null : outfit.id)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-20 flex-shrink-0 overflow-hidden border border-ink/20">
                <img
                  src={outfit.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="txt-meta opacity-60">{formattedDate}</p>
                <p className="text-sm font-bold leading-tight mt-0.5">
                  {outfit.description || 'Untitled'}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {outfitItems.length === 0 ? (
                    <span className="txt-meta opacity-30 italic">No items tagged</span>
                  ) : (
                    outfitItems.map((itemId) => {
                      const item = items.find((i) => i.id === itemId);
                      return (
                        <span key={itemId} className="photo-tag">
                          {item?.name || itemId}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
              {/* Toggle arrow */}
              <span className="txt-meta opacity-30 self-center">
                {isEditing ? '▲' : '▼'}
              </span>
            </div>

            {/* Item picker (expanded) */}
            {isEditing && (
              <div className="mt-4 ml-20">
                <p className="txt-meta font-semibold uppercase opacity-60 mb-2">
                  Tap to toggle items:
                </p>
                {CATEGORIES.map((cat) => {
                  const catItems = items.filter((i) => i.category === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="txt-meta opacity-40 uppercase mb-1">{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {catItems.map((item) => {
                          const isSelected = outfitItems.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(outfit.id, item.id)}
                              disabled={saving}
                              className="transition-all duration-100"
                              style={{
                                background: isSelected ? 'var(--color-text)' : 'transparent',
                                color: isSelected ? '#fff' : 'var(--color-text)',
                                border: '1px solid var(--color-text)',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                opacity: saving ? 0.5 : 1,
                              }}
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
