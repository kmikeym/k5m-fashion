import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { items?: string[] };
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Delete existing links and insert new ones
    await db.prepare('DELETE FROM outfit_items WHERE outfit_id = ?').bind(id).run();

    for (const itemId of items) {
      await db.prepare(
        'INSERT OR IGNORE INTO outfit_items (outfit_id, item_id) VALUES (?, ?)'
      ).bind(id, itemId).run();
    }

    // Return updated outfit
    const outfit = await db.prepare('SELECT * FROM outfits WHERE id = ?').bind(id).first();
    return NextResponse.json({ ...outfit, items });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
