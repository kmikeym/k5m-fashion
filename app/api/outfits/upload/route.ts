import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Dynamic require — only works in Node.js (local dev)
    try {
      const fs = await import('fs');
      const path = await import('path');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timestamp = now.getTime();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${dateStr}-${timestamp}.${ext}`;
      const id = `${dateStr}-${timestamp}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(path.join(process.cwd(), 'public', 'outfits', filename), buffer);

      const outfitsPath = path.join(process.cwd(), 'data', 'outfits.json');
      const outfits = JSON.parse(fs.readFileSync(outfitsPath, 'utf-8'));
      const newOutfit = { id, date: dateStr, image: `/outfits/${filename}`, description: '', items: [], location: '' };
      outfits.unshift(newOutfit);
      fs.writeFileSync(outfitsPath, JSON.stringify(outfits, null, 2) + '\n');

      return NextResponse.json(newOutfit, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Upload requires local dev mode' }, { status: 501 });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
