import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getD1 } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const excludeOwn = searchParams.get('exclude_own') === 'true';
  const userOnly = searchParams.get('user_id');

  const { userId } = await auth();
  const db = await getD1();

  if (!db) {
    // Fallback: return empty array (JSON data doesn't have user_id)
    return NextResponse.json([]);
  }

  let query = 'SELECT id, date, image, description, location, user_id FROM outfits';
  const params: string[] = [];

  if (userOnly) {
    // Fetch a specific user's outfits
    query += ' WHERE user_id = ?';
    params.push(userOnly);
  } else if (excludeOwn && userId) {
    // Feed mode: exclude current user's outfits
    query += ' WHERE user_id != ?';
    params.push(userId);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const { results } = await db.prepare(query).bind(...params).all();

  // Attach items from outfit_items join
  const outfits = await Promise.all(
    (results as Record<string, unknown>[]).map(async (row) => {
      const { results: itemRows } = await db.prepare(
        'SELECT item_id FROM outfit_items WHERE outfit_id = ?'
      ).bind(row.id).all();
      return {
        ...row,
        items: itemRows.map((r) => r.item_id as string),
      };
    })
  );

  return NextResponse.json(outfits);
}
