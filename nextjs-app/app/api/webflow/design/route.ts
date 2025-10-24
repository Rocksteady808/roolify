import { NextResponse } from 'next/server';
import { setDesignData } from "../../../../lib/designStore";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const designData = await req.json();
    
    logger.debug("Received design data", { designData });
    
    const {
      siteId,
      siteName,
      allStyles,
      selectedElement,
      timestamp,
      allElements // This should contain all elements with IDs
    } = designData;
    
    // Log the received data for debugging
    logger.debug("Design data details", {
      siteId,
      siteName,
      stylesCount: allStyles?.length || 0,
      selectedElement,
      elementsCount: allElements?.length || 0
    });
    
    // Extract elements with IDs from the design data
    const elementsWithIds: any[] = [];
    
    // Process allStyles to find elements with IDs
    if (allStyles && Array.isArray(allStyles)) {
      allStyles.forEach((style: any) => {
        if (style.id && style.id.trim()) {
          elementsWithIds.push({
            id: style.id,
            name: style.name || style.displayName || style.id,
            type: style.type || 'element',
            selector: `#${style.id}`,
            tagName: style.tagName || 'div',
            className: style.className,
            isFormField: style.type === 'form' || style.tagName === 'input' || style.tagName === 'select' || style.tagName === 'textarea'
          });
        }
      });
    }
    
    // Process allElements if available
    if (allElements && Array.isArray(allElements)) {
      allElements.forEach((element: any) => {
        if (element.id && element.id.trim() && !elementsWithIds.find(e => e.id === element.id)) {
          elementsWithIds.push({
            id: element.id,
            name: element.name || element.displayName || element.id,
            type: element.type || 'element',
            selector: `#${element.id}`,
            tagName: element.tagName || 'div',
            className: element.className,
            isFormField: element.type === 'form' || element.tagName === 'input' || element.tagName === 'select' || element.tagName === 'textarea'
          });
        }
      });
    }
    
    logger.debug(`Found ${elementsWithIds.length} elements with IDs`, { count: elementsWithIds.length });
    
    // Store the design data
    const designDataToStore = {
      siteId,
      siteName,
      elements: elementsWithIds,
      lastUpdated: new Date().toISOString()
    };
    
    setDesignData(siteId, designDataToStore);
    
    return NextResponse.json({ 
      success: true, 
      message: "Design data received and processed successfully",
      receivedAt: new Date().toISOString(),
      data: {
        siteId,
        siteName,
        stylesCount: allStyles?.length || 0,
        elementsCount: elementsWithIds.length,
        hasSelectedElement: !!selectedElement
      }
    });
    
  } catch (error) {
    logger.error("Error processing design data", error);
    return NextResponse.json(
      { error: "Failed to process design data", details: String(error) }, 
      { status: 500 }
    );
  }
}
