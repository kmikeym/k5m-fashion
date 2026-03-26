import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTFITS_PATH = path.join(process.cwd(), 'data', 'outfits.json');

export async function GET() {
  const raw = fs.readFileSync(OUTFITS_PATH, 'utf-8');
  const outfits = JSON.parse(raw);
  return NextResponse.json(outfits);
}
