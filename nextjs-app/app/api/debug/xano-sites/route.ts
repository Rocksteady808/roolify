import { NextResponse } from 'next/server';
import { xanoSites } from '../../../../lib/xano';

/**
 * Debug endpoint to test Xano sites API
 * GET /api/debug/xano-sites
 */
export async function GET() {
  try {
    console.log('[Debug] Testing Xano sites API...');
    
    // Try to get all sites
    const sites = await xanoSites.getAll();
    
    console.log(`[Debug] Found ${sites.length} sites in Xano`);
    
    return NextResponse.json({
      success: true,
      sites,
      count: sites.length
    });
    
  } catch (error) {
    console.error('[Debug] Xano sites API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
