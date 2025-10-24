import { NextResponse } from 'next/server';
import { xanoSites } from '../../../../../lib/xano';
import webflowStore from '../../../../../lib/webflowStore';
import { getCurrentUserId } from '../../../../../lib/serverAuth';
import { logger } from '@/lib/logger';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:1';

/**
 * Get user ID from Bearer token in Authorization header
 */
async function getUserIdFromToken(authHeader: string | null): Promise<number | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.error('[Migration] Failed to get user from token:', response.status);
      return null;
    }

    const user = await response.json();
    return user.id || null;
  } catch (error) {
    logger.error('[Migration] Error validating token:', error);
    return null;
  }
}

/**
 * Migrate sites from webflow-tokens.json to Xano
 * POST /api/xano/sites/migrate-from-file
 * 
 * This endpoint:
 * 1. Gets the authenticated user's ID (from Bearer token or cookies)
 * 2. Reads all sites from webflow-tokens.json
 * 3. Creates/updates them in Xano with the user's ID
 */
export async function POST(req: Request) {
  try {
    // Try to get user ID from Authorization header first (for client-side calls)
    const authHeader = req.headers.get('authorization');
    let userId = await getUserIdFromToken(authHeader);

    // Fall back to cookie-based auth (for direct browser navigation)
    if (!userId) {
      userId = await getCurrentUserId();
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required. Please log in first.' 
      }, { status: 401 });
    }

    logger.debug(`[Site Migration] Starting migration for user ${userId}...`);
    
    // Get all sites from webflow-tokens.json
    const sites = [];
    for (const [siteId, record] of webflowStore.entries()) {
      if (record.site) {
        sites.push({
          siteId,
          site: record.site,
          token: record.token,
          hasToken: !!record.token
        });
      }
    }
    
    logger.debug(`[Site Migration] Found ${sites.length} sites in webflow-tokens.json`);
    
    if (sites.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No sites found in webflow-tokens.json to migrate',
        migrated: [],
        failed: []
      });
    }
    
    const migrated = [];
    const failed = [];
    
    // Migrate each site to Xano
    for (const site of sites) {
      try {
        const siteData = {
          webflow_site_id: site.siteId,
          site_name: site.site.displayName || site.site.name || site.site.shortName || site.siteId,
          user_id: userId, // Associate with current user
          webflow_access_token: site.hasToken ? 'stored_in_file' : undefined,
          installed_at: Date.now(),
          is_active: true
        };
        
        logger.debug(`[Site Migration] Migrating: ${siteData.site_name} (${site.siteId})`);
        
        // Use upsert to create or update
        const migratedSite = await xanoSites.upsert(siteData);
        
        migrated.push({
          siteId: site.siteId,
          siteName: siteData.site_name,
          xanoId: migratedSite.id,
          success: true
        });
        
        logger.debug(`[Site Migration] ✅ Migrated: ${siteData.site_name} (Xano ID: ${migratedSite.id})`);
        
      } catch (siteError) {
        logger.error(`[Site Migration] ❌ Failed to migrate ${site.siteId}:`, siteError);
        failed.push({
          siteId: site.siteId,
          siteName: site.site?.displayName || site.siteId,
          error: siteError instanceof Error ? siteError.message : String(siteError),
          success: false
        });
      }
    }
    
    const response = {
      success: true,
      userId,
      message: `Successfully migrated ${migrated.length} sites, ${failed.length} failures`,
      stats: {
        total: sites.length,
        migrated: migrated.length,
        failed: failed.length
      },
      migrated,
      failed
    };
    
    logger.debug(`[Site Migration] Complete:`, response.stats);
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('[Site Migration] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to migrate sites',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET(req: Request) {
  return POST(req);
}

