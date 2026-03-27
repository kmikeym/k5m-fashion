import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  const db = await getD1();
  if (!db) {
    const outfitsData = await import('@/data/outfits.json');
    return NextResponse.json(outfitsData.default);
  }

  // Get outfits
  const { results: outfits } = await db.prepare(
    'SELECT id, date, image, description, location FROM outfits ORDER BY date DESC'
  ).all();

  // Get all outfit-item mappings
  const { results: links } = await db.prepare(
    'SELECT outfit_id, item_id FROM outfit_items'
  ).all();

  // Attach items array to each outfit
  const outfitsWithItems = outfits.map((o: Record<string, unknown>) => ({
    ...o,
    items: links
      .filter((l: Record<string, unknown>) => l.outfit_id === o.id)
      .map((l: Record<string, unknown>) => l.item_id),
  }));

  return NextResponse.json(outfitsWithItems);
}
