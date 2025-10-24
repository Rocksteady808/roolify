import { NextResponse } from 'next/server';
import { getDesignData } from "../../../../../../lib/designStore";
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

    const designData = getDesignData(siteId);
    if (!designData) {
      return NextResponse.json({ 
        error: "No design data found for this site. Please run the design scanner from the Webflow extension first.",
        elements: [] 
      }, { status: 404 });
    }

    return NextResponse.json({
      siteId,
      siteName: designData.siteName,
      elements: designData.elements,
      lastUpdated: designData.lastUpdated,
      count: designData.elements.length
    });
  } catch (err) {
    logger.error("Error fetching design elements", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err),
      elements: [] 
    }, { status: 500 });
  }
}





