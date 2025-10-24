import { NextResponse } from 'next/server';
import { xanoAuth } from '@/lib/xano';

export async function GET(request: Request) {
  try {
    // Get the auth token from the Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      // Fallback to cookie check
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        token = cookies['xano_auth_token'] || cookies['webflow_token'];
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
    }
    
    // Set the token temporarily for the request
    const originalToken = xanoAuth.getToken();
    if (typeof window === 'undefined') {
      // Server-side: we can't use localStorage, so we'll make the request directly
      const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:pU92d7fv/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: response.status });
      }
      
      const userData = await response.json();
      return NextResponse.json(userData);
    } else {
      // Client-side: use the existing auth system
      try {
        const userData = await xanoAuth.me();
        return NextResponse.json(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 401 });
      }
    }
    
  } catch (error) {
    console.error('Error in /api/user/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





