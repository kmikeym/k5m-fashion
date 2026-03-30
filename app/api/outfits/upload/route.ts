import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';
import { GENERAL_USER_ID, ADMIN_USER_ID } from '@/lib/constants';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to post' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const description = (formData.get('description') as string) || '';
    const bucket = formData.get('bucket') as string | null;

    // Admin can post as editorial (general bucket)
    const effectiveUserId = (bucket === 'general' && userId === ADMIN_USER_ID)
      ? GENERAL_USER_ID
      : userId;

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

    // Save metadata to D1 with user_id
    await db.prepare(
      'INSERT INTO outfits (id, date, image, description, location, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, dateStr, `/outfits/${filename}`, description, '', effectiveUserId).run();

    // TODO: R2 integration for production image uploads
    return NextResponse.json({
      id,
      date: dateStr,
      image: `/outfits/${filename}`,
      description,
      items: [],
      location: '',
      user_id: effectiveUserId,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
