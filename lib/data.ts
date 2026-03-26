import outfitsData from '@/data/outfits.json';
import itemsData from '@/data/items.json';
import type { Outfit, Item } from './types';

export function getOutfits(): Outfit[] {
  return (outfitsData as Outfit[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getOutfit(id: string): Outfit | undefined {
  return (outfitsData as Outfit[]).find((o) => o.id === id);
}

export function getItems(): Item[] {
  return itemsData as Item[];
}

export function getItem(id: string): Item | undefined {
  return (itemsData as Item[]).find((i) => i.id === id);
}

export function getItemsForOutfit(outfit: Outfit): Item[] {
  const items = getItems();
  return outfit.items
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as Item[];
}

export function getOutfitsForItem(itemId: string): Outfit[] {
  return getOutfits().filter((o) => o.items.includes(itemId));
}
