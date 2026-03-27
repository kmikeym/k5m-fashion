import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json() as { description?: string; date?: string; location?: string };

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: string[] = [];

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.prepare(
      `UPDATE outfits SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const outfit = await db.prepare('SELECT * FROM outfits WHERE id = ?').bind(id).first();
    return NextResponse.json(outfit);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
