import { NextResponse } from 'next/server';
import crypto from 'crypto';
import querystring from 'querystring';

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

    const method = '/v1/request/callback/';
    const params = {
      from: cleanFrom,
      to: cleanTo,
    };

    // 1. Sort parameters by key name
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: any = {};
    sortedKeys.forEach(key => {
      sortedParams[key] = (params as any)[key];
    });

    // 2. Build query string (Zadarma requires RFC1738 %20 for spaces)
    const paramsStr = querystring.stringify(sortedParams).replace(/\+/g, '%20');

    // 3. Create signature base: method + paramsStr + md5(paramsStr)
    const md5Params = crypto.createHash('md5').update(paramsStr).digest('hex');
    const signatureBase = method + paramsStr + md5Params;

    // 4. Hash with HMAC-SHA1 and base64 encode
    const signature = crypto
      .createHmac('sha1', apiSecret)
      .update(signatureBase)
      .digest('base64');

    const authHeader = `${apiKey}:${signature}`;

    console.log('[Zadarma API] Signature Base:', signatureBase);
    console.log('[Zadarma API] Auth Header:', authHeader);

    const url = `https://api.zadarma.com${method}?${paramsStr}`;

    console.log(`[Zadarma API] Triggering Callback: ${from} -> ${to}`);

    const response = await fetch(url, {
      method: 'GET', // Zadarma callback is typically a GET with auth header
      headers: {
        'Authorization': authHeader
      }
    });

    const data = await response.json();

    if (data.status === 'success' || data.status === 'ok') {
      return NextResponse.json({ success: true, data });
    } else {
      console.error('[Zadarma API] Callback Error:', data);
      return NextResponse.json({ success: false, error: data.message || 'Zadarma API Error' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Zadarma API] Internal Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
