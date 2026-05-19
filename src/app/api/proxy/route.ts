import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const body = await response.text();
    
    // Inject a base tag to fix relative links inside the proxied page
    const baseUrl = new URL(url).origin;
    const transformedBody = body.replace(
      '<head>',
      `<head><base href="${baseUrl}">`
    );

    const headers = new Headers();
    headers.set('Content-Type', 'text/html');
    // REMOVE X-Frame-Options and CSP to allow embedding
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(transformedBody, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Failed to fetch the map page', { status: 500 });
  }
}
