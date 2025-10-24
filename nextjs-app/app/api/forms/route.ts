import { NextResponse } from 'next/server';
import { getFormsForSite } from "../../../lib/formsStore";

// GET /api/forms?siteId=xxx - returns all forms for a site
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ 
        error: "siteId parameter required" 
      }, { 
        status: 400
      });
    }

    const forms = getFormsForSite(siteId);
    
    return NextResponse.json({ 
      siteId, 
      forms: forms || [],
      count: forms?.length || 0
    });
    
  } catch (err) {
    console.error("Error fetching forms:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { 
      status: 500
    });
  }
}





