import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items.json');

function readItems() {
  const raw = fs.readFileSync(ITEMS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeItems(items: unknown[]) {
  fs.writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2) + '\n');
}

// GET all items
export async function GET() {
  const items = readItems();
  return NextResponse.json(items);
}

// POST new item
export async function POST(request: NextRequest) {
  try {
    const { name, category } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'name and category required' }, { status: 400 });
    }

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const items = readItems();

    // Check for duplicate
    if (items.find((i: { id: string }) => i.id === id)) {
      return NextResponse.json({ error: 'Item already exists', id }, { status: 409 });
    }

    const newItem = { id, name, category, image: `/items/${id}.jpg` };
    items.push(newItem);
    writeItems(items);

    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
