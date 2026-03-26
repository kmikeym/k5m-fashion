import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTFITS_PATH = path.join(process.cwd(), 'data', 'outfits.json');

function readOutfits() {
  const raw = fs.readFileSync(OUTFITS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeOutfits(outfits: unknown[]) {
  fs.writeFileSync(OUTFITS_PATH, JSON.stringify(outfits, null, 2) + '\n');
}

// PUT — replace outfit's item list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 });
    }

    const outfits = readOutfits();
    const index = outfits.findIndex((o: { id: string }) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    outfits[index].items = items;
    writeOutfits(outfits);

    return NextResponse.json(outfits[index]);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
