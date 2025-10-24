import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Auth API] Login attempt for:', email);
    console.log('[Auth API] Using URL:', `${AUTH_BASE_URL}/auth/login`);

    // Forward request to Xano
    const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[Auth API] Xano response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth API] Xano error:', errorText);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Auth API] Login successful');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

