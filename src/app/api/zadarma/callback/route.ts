import { NextResponse } from 'next/server';

// Use the official Zadarma SDK — guarantees correct signature encoding
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Zadarma = require('zadarma-api');

export async function POST(request: Request) {
  try {
    const { from, to } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_ZADARMA_API_KEY;
    const apiSecret = process.env.ZADARMA_API_SECRET || process.env.NEXT_PUBLIC_ZADARMA_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Zadarma API credentials missing. Set ZADARMA_API_SECRET in environment.' },
        { status: 500 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to' },
        { status: 400 }
      );
    }

    const api = new Zadarma.Api(apiKey, apiSecret);

    console.log(`[Zadarma API] Triggering Callback: ${from} -> ${to}`);

    const data = await api.requestCallback(from, to);

    console.log(`[Zadarma API] Callback Response:`, JSON.stringify(data));

    if (data.status === 'success') {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || 'Zadarma API Error', details: data },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Zadarma API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
