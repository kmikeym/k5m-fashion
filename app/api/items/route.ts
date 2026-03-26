import { NextRequest, NextResponse } from 'next/server';
import itemsData from '@/data/items.json';

export const runtime = 'edge';

// GET all items — works everywhere (reads from bundled JSON)
export async function GET() {
  return NextResponse.json(itemsData);
}

// POST new item — local dev only (needs filesystem)
export async function POST(request: NextRequest) {
  try {
    const { name, category } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'name and category required' }, { status: 400 });
    }

    // Dynamic require — only works in Node.js (local dev)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'items.json');
      const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (items.find((i: { id: string }) => i.id === id)) {
        return NextResponse.json({ error: 'Item already exists', id }, { status: 409 });
      }

      const newItem = { id, name, category, image: `/items/${id}.jpg` };
      items.push(newItem);
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2) + '\n');

      return NextResponse.json(newItem, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Admin features require local dev mode' }, { status: 501 });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
