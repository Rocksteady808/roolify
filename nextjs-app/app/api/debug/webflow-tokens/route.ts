import { NextResponse } from 'next/server';
import { getSitesForUser } from '../../../../lib/webflowStore';
import fs from 'fs';
import path from 'path';

/**
 * Debug endpoint to check Webflow tokens
 * GET /api/debug/webflow-tokens
 */
export async function GET() {
  try {
    const TOKENS_FILE = path.join(process.cwd(), 'webflow-tokens.json');
    
    // Check if file exists
    const fileExists = fs.existsSync(TOKENS_FILE);
    
    let fileContent = null;
    if (fileExists) {
      fileContent = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    // Get sites from the store
    const sites = getSitesForUser();
    
    return NextResponse.json({
      success: true,
      fileExists,
      fileContent,
      sitesFromStore: sites,
      sitesCount: sites.length
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
