import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log('[Auth API] Signup attempt for:', email);

    // Forward request to Xano
    const response = await fetch(`${AUTH_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    console.log('[Auth API] Xano response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth API] Xano error:', errorText);
      return NextResponse.json(
        { error: 'Signup failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Auth API] Signup successful');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auth API] Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

