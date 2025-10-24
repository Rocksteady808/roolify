import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('xano_auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      );
    }

    console.log('[Auth API] Fetching user data');

    // Forward request to Xano
    const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('[Auth API] Xano response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth API] Xano error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Auth API] User data fetched successfully');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auth API] Me error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user data' },
      { status: 500 }
    );
  }
}

