import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/data/lists');

// Ensure the directory exists
async function ensureDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  await ensureDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const lists = [];
    let allLeads: any[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        const data = JSON.parse(content);
        lists.push(data.list);
        allLeads = [...allLeads, ...data.leads];
      }
    }

    return NextResponse.json({ lists, leads: allLeads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read leads data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureDir();
  try {
    const { list, leads } = await request.json();
    if (!list || !list.id) {
      return NextResponse.json({ error: 'Invalid list data' }, { status: 400 });
    }

    const filePath = path.join(DATA_DIR, `${list.id}.json`);
    await fs.writeFile(filePath, JSON.stringify({ list, leads }, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save leads data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureDir();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.unlink(filePath).catch(() => {}); // Ignore if file doesn't exist

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
