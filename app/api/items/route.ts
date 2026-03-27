import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  const db = await getD1();
  if (!db) {
    // Fallback to bundled JSON
    const itemsData = await import('@/data/items.json');
    return NextResponse.json(itemsData.default);
  }

  const { results } = await db.prepare(
    'SELECT id, name, category, image FROM items ORDER BY name'
  ).all();
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; category?: string };
    const { name, category } = body;
    if (!name || !category) {
      return NextResponse.json({ error: 'name and category required' }, { status: 400 });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Check for duplicate
    const existing = await db.prepare('SELECT id FROM items WHERE id = ?').bind(id).first();
    if (existing) {
      return NextResponse.json({ error: 'Item already exists', id }, { status: 409 });
    }

    const image = `/items/${id}.jpg`;
    await db.prepare(
      'INSERT INTO items (id, name, category, image) VALUES (?, ?, ?, ?)'
    ).bind(id, name, category, image).run();

    return NextResponse.json({ id, name, category, image }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
