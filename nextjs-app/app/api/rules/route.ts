import { NextResponse } from 'next/server';

/**
 * Legacy /api/rules endpoint - now proxies to /api/form-rules for backward compatibility
 * 
 * This endpoint is kept for backward compatibility but now uses Xano instead of local JSON storage.
 * All new code should use /api/form-rules directly.
 */

export async function POST(req: Request) {
  try {
    // Proxy POST requests to /api/form-rules
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337';
    const response = await fetch(`${appUrl}/api/form-rules`, {
      method: 'POST',
      headers: req.headers,
      body: await req.text()
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying to /api/form-rules:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to form-rules", details: String(error) }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Proxy GET requests to /api/form-rules
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337';
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Build the proxy URL with all query parameters
    const proxyUrl = new URL('/api/form-rules', appUrl);
    searchParams.forEach((value, key) => {
      proxyUrl.searchParams.set(key, value);
    });
    
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers: req.headers
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying to /api/form-rules:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to form-rules", details: String(error) },
      { status: 500 }
    );
  }
}


