import { NextResponse } from 'next/server';
import { xanoNotifications, xanoSites } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Fix Site Mismatch] Updating notification settings to use correct site...');
    
    // Get all sites to find the correct site ID
    const allSites = await xanoSites.getAll();
    const correctSite = allSites.find(s => s.webflow_site_id === '68eb5d6db0e34d2e3ed12c0a');
    
    if (!correctSite) {
      throw new Error('Site not found');
    }
    
    console.log('[Fix Site Mismatch] Found correct site:', correctSite.id, 'for site_id:', correctSite.webflow_site_id);
    
    // Update the notification settings to use the correct site
    const result = await xanoNotifications.update(54, {
      site: correctSite.id, // Use the correct site ID
      // Keep all other fields the same
    });
    
    console.log('[Fix Site Mismatch] ✅ Updated notification settings to use correct site');
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings updated to use correct site',
      result
    });
    
  } catch (error: any) {
    console.error('[Fix Site Mismatch] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fix site mismatch'
    }, { status: 500 });
  }
}

