import { NextResponse } from 'next/server';
import { getDesignData, setDesignData } from "../../../../../../lib/designStore";
import { logger } from '@/lib/logger';

export async function POST(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    const { url } = await req.json();
    
    if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    logger.debug('Scanning elements for site', { siteId, url });

    // Call the element scanning API
    const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/elements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, siteId })
    });

    if (!scanResponse.ok) {
      const errorData = await scanResponse.json();
      return NextResponse.json({ 
        error: "Failed to scan elements", 
        details: errorData.error 
      }, { status: 500 });
    }

    const scanData = await scanResponse.json();
    const domElements = scanData.elements || [];

    // Mark DOM elements with source
    const markedElements = domElements.map((el: any) => ({
      ...el,
      source: 'dom' as const
    }));

    // Get existing design data
    const existingData = getDesignData(siteId);
    let allElements = [...markedElements];

    // Merge with existing Webflow elements if they exist
    if (existingData) {
      const webflowElements = existingData.elements.filter(el => el.source === 'webflow');
      allElements = [...webflowElements, ...markedElements];
      
      // Remove duplicates based on ID
      const uniqueElements = [];
      const seenIds = new Set();
      
      for (const element of allElements) {
        if (!seenIds.has(element.id)) {
          seenIds.add(element.id);
          uniqueElements.push(element);
        }
      }
      
      allElements = uniqueElements;
    }

    // Store the updated design data
    const designDataToStore = {
      siteId,
      siteName: existingData?.siteName || `Site ${siteId}`,
      elements: allElements,
      lastUpdated: new Date().toISOString()
    };

    setDesignData(siteId, designDataToStore);

    return NextResponse.json({
      success: true,
      siteId,
      url,
      elementsCount: allElements.length,
      domElementsCount: markedElements.length,
      webflowElementsCount: existingData?.elements.filter(el => el.source === 'webflow').length || 0,
      elements: allElements,
      scannedAt: new Date().toISOString()
    });

  } catch (err) {
    logger.error("Error scanning site elements", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { status: 500 });
  }
}





