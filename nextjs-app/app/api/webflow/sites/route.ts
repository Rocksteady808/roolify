import { NextResponse } from 'next/server';
import store, { getTokenForSite } from "../../../../lib/webflowStore";
import { xanoSites } from "../../../../lib/xano";
import { getCurrentUser } from "../../../../lib/serverAuth";
import { logger } from '@/lib/logger';

// Simple in-memory cache to reduce API calls and prevent 429 errors
const sitesCache = new Map<number, { sites: any[], timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedSites(userId: number): any[] | null {
  const cached = sitesCache.get(userId);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    sitesCache.delete(userId);
    return null;
  }
  
  logger.debug('Using cached sites', { userId, age });
  return cached.sites;
}

function setCachedSites(userId: number, sites: any[]): void {
  sitesCache.set(userId, { sites, timestamp: Date.now() });
}

export async function GET(req: Request) {
  try {
    // Debug: Check auth sources
    const cookieHeader = req.headers.get('cookie');
    const authHeader = req.headers.get('authorization');
    logger.debug('Sites API auth headers', {
      hasCookie: !!cookieHeader,
      hasAuthHeader: !!authHeader
    });
    
    // Try to get user from Authorization header first (more reliable for SPA)
    let currentUser = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:1';
        const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          currentUser = await response.json();
          logger.debug('Got user from Authorization header', { userId: currentUser.id });
        }
      } catch (err) {
        logger.error('Failed to validate Authorization header', err);
      }
    }
    
    // Fallback to cookie-based auth
    if (!currentUser) {
      currentUser = await getCurrentUser();
      if (currentUser) {
        logger.debug('Got user from cookie', { userId: currentUser.id });
      }
    }
    
    logger.debug('Final user authentication', {
      userId: currentUser?.id || null,
      hasUser: !!currentUser
    });
    
    // If no user, return error - don't expose all sites
    if (!currentUser) {
      logger.warn('No user found - authentication required');
      return NextResponse.json({ 
        error: 'Authentication required',
        sites: []
      }, { status: 401 });
    }

    logger.debug('Fetching sites for user', {
      userId: currentUser.id,
      userEmail: currentUser.email
    });

    // Check cache first to reduce API calls
    const cachedSites = getCachedSites(currentUser.id);
    if (cachedSites) {
      return NextResponse.json({ sites: cachedSites, cached: true });
    }

    // Try to get sites from Xano (filtered by user)
    try {
      const allSites = await xanoSites.getAll();
      const userSites = allSites.filter(s => s.user_id === currentUser.id);
      
      logger.debug('Found user sites', {
        count: userSites.length,
        userId: currentUser.id
      });
      
      // Map to the expected format
      const out = userSites.map(xanoSite => ({
        siteId: xanoSite.webflow_site_id,
        site: {
          id: xanoSite.webflow_site_id,
          displayName: xanoSite.site_name,
          shortName: xanoSite.site_name,
        },
        hasToken: !!xanoSite.webflow_access_token,
      }));
      
      // Cache the results
      setCachedSites(currentUser.id, out);
      
      return NextResponse.json({ sites: out });
    } catch (xanoError) {
      logger.error('Xano query failed - returning empty sites', xanoError);
      
      // Don't fallback to unfiltered file store - security risk
      // Return empty array and let user retry
      return NextResponse.json({ 
        sites: [],
        error: 'Failed to fetch sites. Please refresh the page.',
        retryable: true
      });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
