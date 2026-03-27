'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { Outfit, Item } from '@/lib/types';
import { getDisplayName } from '@/lib/data';

const CATEGORIES = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'hats'] as const;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmikeym@kmikeym.com';

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === ADMIN_EMAIL;

  if (!isLoaded) return null;

  if (!isAdmin) {
    return (
      <div
        className="relative z-10 text-center max-w-3xl mx-auto w-full"
        style={{ padding: '80px var(--pad)' }}
      >
        <h2 className="txt-display-outline">Access</h2>
        <h3 className="txt-display-solid">Denied</h3>
        <p className="txt-meta opacity-50 mt-4">
          Admin is restricted to the wardrobe owner.
        </p>
      </div>
    );
  }
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editingOutfit, setEditingOutfit] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemType, setNewItemType] = useState('');
  const [newItemColor, setNewItemColor] = useState('');
  const [newItemModifier, setNewItemModifier] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('tops');
  const [newItemStatus, setNewItemStatus] = useState<string>('owned');
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  async function refreshOutfits() {
    // Fetch fresh from the JSON file via a cache-busting import
    const res = await fetch(`/api/outfits/list?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setOutfits(
        (data as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then((r) => r.json()),
      fetch('/api/outfits/list').then((r) => r.json()),
    ]).then(([itemsData, outfitsData]) => {
      setItems(itemsData as Item[]);
      setOutfits(
        (outfitsData as Outfit[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/outfits/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await refreshOutfits();
      }
    } catch {
      // Handle error silently for now
    }

    setUploading(false);
    // Reset the input so the same file can be uploaded again
    e.target.value = '';
  }

  async function refreshItems() {
    const data = await fetch('/api/items').then((r) => r.json());
    setItems(data as Item[]);
  }

  const newItemPreview = [newItemColor, newItemModifier, newItemType].filter(Boolean).join(' ') || 'Item Name Preview';

  async function addNewItem() {
    if (!newItemType.trim()) return;
    setSaving(true);

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newItemType.trim(),
        color: newItemColor.trim() || undefined,
        modifier: newItemModifier.trim() || undefined,
        brand: newItemBrand.trim() || undefined,
        size: newItemSize.trim() || undefined,
        category: newItemCategory,
        status: newItemStatus,
      }),
    });

    if (res.ok) {
      await refreshItems();
      setNewItemType('');
      setNewItemColor('');
      setNewItemModifier('');
      setNewItemBrand('');
      setNewItemSize('');
      setShowNewItem(false);
    }
    setSaving(false);
  }

  async function saveField(outfitId: string, field: string, value: string) {
    setSaving(true);
    const res = await fetch(`/api/outfits/${outfitId}/details`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setOutfits((prev) =>
        prev.map((o) => (o.id === outfitId ? { ...o, [field]: value } : o))
      );
    }
    setEditingField(null);
    setSaving(false);
  }

  function startEdit(key: string, currentValue: string) {
    setEditingField(key);
    setEditValue(currentValue);
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

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxImage]);

  return (
    <>
    {/* Lightbox */}
    {lightboxImage && (
      <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
        <img src={lightboxImage} alt="Full size outfit" />
      </div>
    )}

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

      {/* Upload New Outfit */}
      <div className="mb-10" style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '24px' }}>
        <div className="flex justify-between items-center">
          <p className="txt-meta font-semibold uppercase">
            Outfits ({outfits.length})
          </p>
          <label
            className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer"
            style={{ opacity: uploading ? 0.3 : 1 }}
          >
            {uploading ? 'Uploading...' : '+ New Outfit'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
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
          <div className="flex flex-col gap-3">
            {/* Live preview */}
            <div className="text-lg font-bold tracking-tight" style={{ opacity: newItemType ? 1 : 0.3 }}>
              {newItemPreview}
              {newItemBrand && <span className="txt-meta opacity-40 ml-2">{newItemBrand}</span>}
            </div>

            {/* Row 1: Type (required) + Color + Modifier */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="txt-meta opacity-50 block mb-1">Type *</label>
                <input
                  type="text"
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  placeholder="Jeans, Hat, Tee..."
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                  onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
                />
              </div>
              <div className="flex-1">
                <label className="txt-meta opacity-50 block mb-1">Color</label>
                <input
                  type="text"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  placeholder="Black, Blue..."
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
              <div className="flex-1">
                <label className="txt-meta opacity-50 block mb-1">Modifier</label>
                <input
                  type="text"
                  value={newItemModifier}
                  onChange={(e) => setNewItemModifier(e.target.value)}
                  placeholder="Slim, LA Dodgers..."
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>

            {/* Row 2: Brand + Size + Category + Status */}
            <div className="flex gap-2 items-end">
              <div>
                <label className="txt-meta opacity-50 block mb-1">Brand</label>
                <input
                  type="text"
                  value={newItemBrand}
                  onChange={(e) => setNewItemBrand(e.target.value)}
                  placeholder="Carhartt..."
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                  style={{ width: 120 }}
                />
              </div>
              <div>
                <label className="txt-meta opacity-50 block mb-1">Size</label>
                <input
                  type="text"
                  value={newItemSize}
                  onChange={(e) => setNewItemSize(e.target.value)}
                  placeholder="M, 32..."
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                  style={{ width: 80 }}
                />
              </div>
              <div>
                <label className="txt-meta opacity-50 block mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="txt-meta opacity-50 block mb-1">Status</label>
                <select
                  value={newItemStatus}
                  onChange={(e) => setNewItemStatus(e.target.value)}
                  className="border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  <option value="owned">owned</option>
                  <option value="packed">packed</option>
                  <option value="wishlist">wishlist</option>
                  <option value="retired">retired</option>
                </select>
              </div>
              <button
                onClick={addNewItem}
                disabled={saving || !newItemType.trim()}
                className="photo-tag cursor-pointer hover:opacity-70 transition-opacity py-2 px-4"
                style={{ fontSize: '12px' }}
              >
                Add
              </button>
            </div>
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
              {/* Thumbnail — click for lightbox */}
              <div
                className="w-48 h-60 flex-shrink-0 overflow-hidden border border-ink/20 cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); setLightboxImage(outfit.image); }}
              >
                <img
                  src={outfit.image}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const parent = img.parentElement;
                    if (parent) {
                      img.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'outfit-img-fallback';
                      const label = document.createElement('span');
                      label.className = 'txt-meta font-bold';
                      label.textContent = formattedDate;
                      fallback.appendChild(label);
                      parent.insertBefore(fallback, parent.firstChild);
                    }
                  }}
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                {/* Description — editable */}
                {editingField === `${outfit.id}-description` ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveField(outfit.id, 'description', editValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveField(outfit.id, 'description', editValue);
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    autoFocus
                    className="w-full border border-ink/20 bg-transparent px-2 py-1 text-sm font-bold outline-none focus:border-ink"
                    placeholder="Add a title..."
                  />
                ) : (
                  <p
                    className="text-sm font-bold leading-tight cursor-text hover:opacity-70 transition-opacity"
                    onClick={() => startEdit(`${outfit.id}-description`, outfit.description || '')}
                  >
                    {outfit.description || <span className="opacity-30 italic font-normal">Tap to add title...</span>}
                  </p>
                )}

                {/* Date + Location — editable */}
                <div className="flex gap-3 mt-1">
                  {editingField === `${outfit.id}-date` ? (
                    <input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveField(outfit.id, 'date', editValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveField(outfit.id, 'date', editValue);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      className="border border-ink/20 bg-transparent px-2 py-0.5 txt-meta outline-none focus:border-ink"
                    />
                  ) : (
                    <span
                      className="txt-meta opacity-60 cursor-text hover:opacity-100 transition-opacity"
                      onClick={() => startEdit(`${outfit.id}-date`, outfit.date)}
                    >
                      {formattedDate}
                    </span>
                  )}

                  {editingField === `${outfit.id}-location` ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveField(outfit.id, 'location', editValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveField(outfit.id, 'location', editValue);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      placeholder="Location..."
                      className="border border-ink/20 bg-transparent px-2 py-0.5 txt-meta outline-none focus:border-ink"
                    />
                  ) : (
                    <span
                      className="txt-meta opacity-40 cursor-text hover:opacity-100 transition-opacity"
                      onClick={() => startEdit(`${outfit.id}-location`, outfit.location || '')}
                    >
                      {outfit.location || 'Add location'}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1.5" onClick={() => setEditingOutfit(isEditing ? null : outfit.id)}>
                  {outfitItems.length === 0 ? (
                    <span className="txt-meta opacity-30 italic">No items tagged</span>
                  ) : (
                    outfitItems.map((itemId) => {
                      const item = items.find((i) => i.id === itemId);
                      return (
                        <span key={itemId} className="photo-tag">
                          {item ? getDisplayName(item) : itemId}
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
              <div className="mt-4 ml-36">
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
                              {getDisplayName(item)}
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
    </>
  );
}
