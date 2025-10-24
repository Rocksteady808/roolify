import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check Authorization header first (for extension)
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // For development, accept any non-empty token
      // In production, validate with Xano or Memberstack
      if (token && token.length > 0) {
        return NextResponse.json({ authenticated: true });
      }
    }
    
    // Fallback to cookie check (for main app)
    const cookieStore = cookies();
    const token = cookieStore.get('webflow_token');
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({ authenticated: true });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
