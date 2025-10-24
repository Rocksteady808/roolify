import { NextResponse } from 'next/server';
import { getAllDesignData } from "../../../../lib/designStore";

export async function GET(req: Request) {
  try {
    const allDesignData = getAllDesignData();
    const debugInfo = [];
    
    for (const [siteId, data] of allDesignData.entries()) {
      debugInfo.push({
        siteId,
        siteName: data.siteName,
        elementsCount: data.elements.length,
        elements: data.elements.map((e: any) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          tagName: e.tagName,
          isFormField: e.isFormField
        })),
        lastUpdated: data.lastUpdated
      });
    }
    
    return NextResponse.json({
      success: true,
      totalSites: debugInfo.length,
      sites: debugInfo
    });
  } catch (err) {
    console.error("Error getting design debug info:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { status: 500 });
  }
}





