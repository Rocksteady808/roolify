import { NextResponse } from 'next/server';
import { xanoSites } from '../../../../../lib/xano';
import webflowStore from '../../../../../lib/webflowStore';
import { getCurrentUserId } from '../../../../../lib/serverAuth';

export async function POST() {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log(`Starting token sync for user ${userId} existing sites...`);
    
    // Get all sites from webflow-tokens.json directly
    const tokens = webflowStore;
    console.log(`Found ${tokens.size} sites in webflow-tokens.json`);
    
    const results = [];
    
    for (const [siteId, record] of tokens.entries()) {
      try {
        // Get token data from file
        const tokenData = record.token;
        const siteData = record.site;
        
        if (!tokenData || !siteData?.id) {
          console.log(`Skipping site ${siteId} - missing token or site data`);
          continue;
        }
        
        // Update the site in Xano with token data
        const updatedSite = await xanoSites.upsert({
          webflow_site_id: siteData.id,
          site_name: siteData.displayName || siteData.name || siteData.shortName || 'Unnamed Site',
          user_id: userId, // Use authenticated user ID
          webflow_access_token: tokenData,
          webflow_refresh_token: undefined, // Webflow doesn't provide refresh tokens in this flow
          token_expires_at: undefined, // Webflow tokens don't expire in this flow
          installed_at: Date.now(),
          is_active: true
        });
        
        console.log(`Updated site ${siteData.id} with token`);
        results.push({
          siteId: siteData.id,
          siteName: siteData.displayName,
          success: true,
          xanoSite: updatedSite
        });
        
      } catch (error) {
        console.error(`Failed to update site ${siteId}:`, error);
        results.push({
          siteId: siteId,
          success: false,
          error: String(error)
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} sites, ${failCount} failures`,
      results
    });
    
  } catch (error) {
    console.error('Error updating site tokens:', error);
    return NextResponse.json(
      { error: 'Failed to update site tokens', details: String(error) },
      { status: 500 }
    );
  }
}
