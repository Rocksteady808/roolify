import { NextResponse } from 'next/server';
import { getTokenForSite } from "../../../../../../lib/webflowStore";

export async function GET(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

    const rec = await getTokenForSite(siteId);
    if (!rec || !rec.token) return NextResponse.json({ error: "no token for site" }, { status: 404 });

    // Webflow pages endpoint (v2 Data API)
    const resp = await fetch(`https://api.webflow.com/v2/sites/${encodeURIComponent(siteId)}/pages`, {
      headers: { Authorization: `Bearer ${rec.token}`, Accept: "application/json" },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: "failed fetching pages", status: resp.status, details: txt }, { status: 502 });
    }

    const data = await resp.json();
    
    // DEBUG: Log raw page data to see what fields Webflow actually returns
    console.log('[Pages API] 📄 Raw Webflow Pages API response:');
    if (data.pages && data.pages.length > 0) {
      console.log('[Pages API] Sample page (first one):', JSON.stringify(data.pages[0], null, 2));
      console.log('[Pages API] Total pages returned:', data.pages.length);
      
      // Check for draft/published fields
      data.pages.forEach((page: any, index: number) => {
        console.log(`[Pages API] Page ${index + 1}: "${page.title || page.slug}" - Fields present:`, {
          hasArchived: 'archived' in page,
          hasIsDraft: 'isDraft' in page,
          hasPublished: 'published' in page,
          hasIsPublished: 'isPublished' in page,
          archivedValue: page.archived,
          isDraftValue: page.isDraft,
          publishedValue: page.published,
          isPublishedValue: page.isPublished
        });
      });
    }
    
    // include stored site info so client can build absolute URLs
    return NextResponse.json({ pages: data.pages || data, site: rec.site || null });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
