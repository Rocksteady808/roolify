import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect test endpoints in production
 * Only allows access in development mode
 */
export function middleware(request: NextRequest) {
  // Only allow test endpoints in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are disabled in production' },
      { status: 404 }
    );
  }

  // Allow in development
  return NextResponse.next();
}

export const config = {
  matcher: '/api/test/:path*',
};





