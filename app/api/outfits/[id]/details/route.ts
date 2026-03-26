import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTFITS_PATH = path.join(process.cwd(), 'data', 'outfits.json');

function readOutfits() {
  return JSON.parse(fs.readFileSync(OUTFITS_PATH, 'utf-8'));
}

function writeOutfits(outfits: unknown[]) {
  fs.writeFileSync(OUTFITS_PATH, JSON.stringify(outfits, null, 2) + '\n');
}

// PATCH — update outfit description, date, location
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const outfits = readOutfits();
    const index = outfits.findIndex((o: { id: string }) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    if (updates.description !== undefined) outfits[index].description = updates.description;
    if (updates.date !== undefined) outfits[index].date = updates.date;
    if (updates.location !== undefined) outfits[index].location = updates.location;

    writeOutfits(outfits);
    return NextResponse.json(outfits[index]);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
