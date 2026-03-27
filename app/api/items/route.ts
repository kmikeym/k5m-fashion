import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  const db = await getD1();
  if (!db) {
    const itemsData = await import('@/data/items.json');
    return NextResponse.json(itemsData.default);
  }

  const { results } = await db.prepare(
    'SELECT id, name, type, color, modifier, brand, size, notes, category, status, tags, image FROM items ORDER BY name'
  ).all();

  const items = (results as Record<string, unknown>[]).map((row) => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
  }));
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      type?: string;
      color?: string;
      modifier?: string;
      brand?: string;
      size?: string;
      notes?: string;
      category?: string;
      status?: string;
      tags?: string[];
    };

    const { type, color, modifier, brand, size, notes, category, status, tags } = body;
    if (!type || !category) {
      return NextResponse.json({ error: 'type and category required' }, { status: 400 });
    }

    const displayName = [color, modifier, type].filter(Boolean).join(' ');
    const id = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const existing = await db.prepare('SELECT id FROM items WHERE id = ?').bind(id).first();
    if (existing) {
      return NextResponse.json({ error: 'Item already exists', id }, { status: 409 });
    }

    const image = `/items/${id}.jpg`;
    const itemStatus = status || 'owned';
    const tagsJson = JSON.stringify(tags || []);

    await db.prepare(
      `INSERT INTO items (id, name, type, color, modifier, brand, size, notes, category, status, tags, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, displayName, type, color || '', modifier || '', brand || '', size || '', notes || '', category, itemStatus, tagsJson, image).run();

    return NextResponse.json({ id, name: displayName, type, color, modifier, brand, size, notes, category, status: itemStatus, tags: tags || [], image }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { id, ...fields } = body;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const allowed = ['type', 'color', 'modifier', 'brand', 'size', 'notes', 'category', 'status', 'tags', 'image'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!allowed.includes(key)) continue;
      updates.push(`${key} = ?`);
      values.push(key === 'tags' ? JSON.stringify(value) : value);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update legacy name field from structured fields
    const item = await db.prepare('SELECT type, color, modifier FROM items WHERE id = ?').bind(id).first() as Record<string, string> | null;
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const newType = (fields.type as string) || item.type;
    const newColor = (fields.color as string) || item.color;
    const newModifier = (fields.modifier as string) || item.modifier;
    const displayName = [newColor, newModifier, newType].filter(Boolean).join(' ');
    updates.push('name = ?');
    values.push(displayName);

    values.push(id);
    await db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
