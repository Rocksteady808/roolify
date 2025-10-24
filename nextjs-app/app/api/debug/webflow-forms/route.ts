import { NextResponse } from 'next/server';
import { getTokenForSite } from "../../../../lib/webflowStore";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId parameter required" }, { status: 400 });
    }

    const rec = getTokenForSite(siteId);
    if (!rec || !rec.token) {
      return NextResponse.json({ error: "no token for site" }, { status: 404 });
    }

    // Fetch forms from Webflow API v2
    const resp = await fetch(`https://api.webflow.com/v2/sites/${encodeURIComponent(siteId)}/forms`, {
      headers: { 
        Authorization: `Bearer ${rec.token}`, 
        "Accept-Version": "2.0.0", 
        Accept: "application/json" 
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ 
        error: "failed fetching forms", 
        status: resp.status, 
        details: txt 
      }, { status: 502 });
    }

    const data = await resp.json();
    
    // Return formatted debug info
    return NextResponse.json({
      siteId,
      rawResponse: data,
      formsPath1: data.forms?.forms,
      formsPath2: data.forms,
      formsPath3: data,
      detectedStructure: {
        hasFormsProperty: !!data.forms,
        hasNestedForms: !!data.forms?.forms,
        topLevelKeys: Object.keys(data),
        formsCount: data.forms?.forms?.length || data.forms?.length || (Array.isArray(data) ? data.length : 0)
      }
    }, { status: 200 });
    
  } catch (err) {
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { status: 500 });
  }
}









