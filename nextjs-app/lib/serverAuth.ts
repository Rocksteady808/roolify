// Server-side authentication utilities
// Used to get current user info from API routes

import { cookies } from 'next/headers';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv';

export interface ServerUser {
  id: number;
  created_at: number;
  name: string;
  email: string;
  plan_id?: number;
  is_admin?: boolean;
}

/**
 * Get current authenticated user from Xano using the auth token in cookies or Authorization header
 * This is for server-side API routes
 */
export async function getCurrentUser(request?: Request): Promise<ServerUser | null> {
  try {
    let authToken: string | null = null;

    // First, try to get token from Authorization header (more reliable for SPA)
    if (request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.replace('Bearer ', '');
        console.log('[ServerAuth] Found token in Authorization header');
      }
    }

    // Fallback to cookie check
    if (!authToken) {
      const cookieStore = await cookies();
      authToken = cookieStore.get('xano_auth_token')?.value;
      if (authToken) {
        console.log('[ServerAuth] Found token in cookies');
      }
    }

    if (!authToken) {
      console.log('[ServerAuth] No auth token found in headers or cookies');
      return null;
    }

    // Call Xano's /auth/me endpoint to get current user
    const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[ServerAuth] Failed to get current user:', response.status, response.statusText);
      return null;
    }

    const user = await response.json();
    console.log('[ServerAuth] Current user:', { id: user.id, email: user.email });
    return user;
  } catch (error) {
    console.error('[ServerAuth] Error getting current user:', error);
    return null;
  }
}

/**
 * Get just the user ID (lighter weight)
 */
export async function getCurrentUserId(request?: Request): Promise<number | null> {
  const user = await getCurrentUser(request);
  return user?.id || null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}





