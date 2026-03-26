import { NextResponse } from 'next/server';
import outfitsData from '@/data/outfits.json';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(outfitsData);
}
