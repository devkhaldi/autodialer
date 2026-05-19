import { NextResponse } from 'next/server';
// @ts-ignore
import Zadarma from 'zadarma-api';

export async function POST(request: Request) {
  try {
    const { from, to } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_ZADARMA_API_KEY;
    const apiSecret = process.env.ZADARMA_API_SECRET || process.env.NEXT_PUBLIC_ZADARMA_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Zadarma API credentials missing' }, { status: 500 });
    }

    // Zadarma requires digits-only for callback API
    const cleanFrom = from.replace(/\D/g, '');
    const cleanTo = to.replace(/\D/g, '');

    console.log(`[Zadarma API] Triggering Callback via SDK: ${from} -> ${to}`);
    
    // Initialize Official SDK
    const api = new Zadarma.Api(apiKey, apiSecret);
    
    // Use the official requestCallback helper
    const result: any = await new Promise((resolve, reject) => {
        api.requestCallback(cleanFrom, cleanTo, null, null, (data: any) => {
            resolve(data);
        });
    });

    if (result.status === 'success' || result.status === 'ok') {
      return NextResponse.json({ success: true, data: result });
    } else {
      console.error('[Zadarma API] Callback Error:', result);
      return NextResponse.json({ success: false, error: result.message || 'Zadarma API Error' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Zadarma API] Internal Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
