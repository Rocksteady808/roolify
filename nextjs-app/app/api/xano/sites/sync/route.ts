import { NextResponse } from 'next/server';
import { xanoSites } from '../../../../../lib/xano';
import webflowStore, { getSitesForUser } from '../../../../../lib/webflowStore';
import { getCurrentUserId } from '../../../../../lib/serverAuth';
import { logActivity } from '../../../../../lib/activityStore';

/**
 * Sync existing Webflow sites to Xano site table
 * POST /api/xano/sites/sync
 */
export async function POST() {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log(`[Site Sync] Starting sync of Webflow sites to Xano for user ${userId}...`);
    
    // Get all connected sites from Webflow tokens
    const sites = getSitesForUser();
    
    console.log(`[Site Sync] Found ${sites.length} connected sites in Webflow tokens`);
    
    const syncedSites = [];
    
    for (const site of sites) {
      try {
        const siteData = {
          webflow_site_id: site.siteId,
          site_name: site.site?.displayName || site.site?.name || site.siteId,
          webflow_access_token: site.hasToken ? 'stored_in_file' : undefined, // Don't expose actual tokens
          installed_at: Date.now(),
          is_active: true,
          user_id: userId // Use authenticated user ID
        };
        
        console.log(`[Site Sync] Upserting site: ${siteData.site_name} (${siteData.webflow_site_id})`);
        
        // Use upsert to create or update
        const syncedSite = await xanoSites.upsert(siteData);
        syncedSites.push(syncedSite);
        
        // Log site connection activity
        try {
          await logActivity({
            type: 'site_connected',
            rule_name: `Connected site: ${syncedSite.site_name}`,
            rule_id: String(syncedSite.id),
            form_id: '',
            site_id: syncedSite.webflow_site_id,
            user: userId // Xano uses 'user' field
          });
          console.log(`[Site Sync] Logged activity for site connection: ${syncedSite.site_name}`);
        } catch (activityError) {
          console.error('[Site Sync] Failed to log activity:', activityError);
          // Don't fail the request if activity logging fails
        }
        
        console.log(`[Site Sync] ✅ Synced site: ${syncedSite.id} - ${syncedSite.site_name}`);
        
      } catch (siteError) {
        console.error(`[Site Sync] ❌ Failed to sync site ${site.siteId}:`, siteError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedSites.length} sites to Xano`,
      sites: syncedSites
    });
    
  } catch (error) {
    console.error('[Site Sync] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync sites'
      },
      { status: 500 }
    );
  }
}
