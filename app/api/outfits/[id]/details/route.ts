import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    try {
      const fs = await import('fs');
      const path = await import('path');
      const outfitsPath = path.join(process.cwd(), 'data', 'outfits.json');
      const outfits = JSON.parse(fs.readFileSync(outfitsPath, 'utf-8'));
      const index = outfits.findIndex((o: { id: string }) => o.id === id);

      if (index === -1) {
        return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
      }

      if (updates.description !== undefined) outfits[index].description = updates.description;
      if (updates.date !== undefined) outfits[index].date = updates.date;
      if (updates.location !== undefined) outfits[index].location = updates.location;

      fs.writeFileSync(outfitsPath, JSON.stringify(outfits, null, 2) + '\n');
      return NextResponse.json(outfits[index]);
    } catch {
      return NextResponse.json({ error: 'Admin features require local dev mode' }, { status: 501 });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
