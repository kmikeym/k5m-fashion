import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${dateStr}-${timestamp}.${ext}`;
    const id = `${dateStr}-${timestamp}`;

    // Save metadata to D1
    await db.prepare(
      'INSERT INTO outfits (id, date, image, description, location) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, dateStr, `/outfits/${filename}`, '', '').run();

    // Note: image file must be committed to repo separately for now
    // TODO: R2 integration for production image uploads
    return NextResponse.json({
      id,
      date: dateStr,
      image: `/outfits/${filename}`,
      description: '',
      items: [],
      location: '',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
