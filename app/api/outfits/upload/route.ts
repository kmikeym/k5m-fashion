import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTFITS_PATH = path.join(process.cwd(), 'data', 'outfits.json');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'outfits');

function readOutfits() {
  return JSON.parse(fs.readFileSync(OUTFITS_PATH, 'utf-8'));
}

function writeOutfits(outfits: unknown[]) {
  fs.writeFileSync(OUTFITS_PATH, JSON.stringify(outfits, null, 2) + '\n');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Generate ID and filename from current timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${dateStr}-${timestamp}.${ext}`;
    const id = `${dateStr}-${timestamp}`;

    // Write image to public/outfits/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);

    // Add outfit entry
    const outfits = readOutfits();
    const newOutfit = {
      id,
      date: dateStr,
      image: `/outfits/${filename}`,
      description: '',
      items: [],
      location: '',
    };

    // Add to beginning (newest first)
    outfits.unshift(newOutfit);
    writeOutfits(outfits);

    return NextResponse.json(newOutfit, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
