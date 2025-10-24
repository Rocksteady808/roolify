import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    logger.debug(`[Scan Options] Scanning ${url} for select options`);

    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    logger.debug(`[Scan Options] Fetched ${html.length} characters of HTML`);

    // Extract select elements with their options
    const selectElements = extractSelectElements(html);
    logger.debug(`[Scan Options] Found ${selectElements.length} select elements`);

    return NextResponse.json({
      success: true,
      selectElements,
      url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Scan Options] Error:', error);
    return NextResponse.json(
      { error: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function extractSelectElements(html: string) {
  const selectElements: Array<{
    id: string;
    name: string;
    options: string[];
    formId?: string;
  }> = [];

  // Find all select elements with IDs
  const selectRegex = /<select\b[^>]*\bid=(["']?)([^"'\s>]+)\1[^>]*>([\s\S]*?)<\/select>/gi;
  let match;

  while ((match = selectRegex.exec(html)) !== null) {
    const selectId = match[2];
    const selectContent = match[3];
    
    // Extract name attribute
    const nameMatch = match[0].match(/name=(["']?)([^"'\s>]+)\1/);
    const selectName = nameMatch ? nameMatch[2] : selectId;

    // Extract options
    const options: string[] = [];
    const optionRegex = /<option\b[^>]*>([^<]+)<\/option>/gi;
    let optionMatch;

    while ((optionMatch = optionRegex.exec(selectContent)) !== null) {
      const optionText = optionMatch[1].trim();
      // Skip empty or placeholder options
      if (optionText && 
          optionText !== 'Select one...' && 
          optionText !== 'Choose...' && 
          optionText !== 'Select...' &&
          optionText !== '') {
        options.push(optionText);
      }
    }

    // Try to find parent form
    const formMatch = html.match(new RegExp(`<form[^>]*>([\\s\\S]*?)<select[^>]*id=["']?${selectId}["']?[^>]*>`, 'i'));
    const formId = formMatch ? extractFormId(formMatch[0]) : undefined;

    if (options.length > 0) {
      selectElements.push({
        id: selectId,
        name: selectName,
        options,
        formId
      });
    }
  }

  return selectElements;
}

function extractFormId(formTag: string): string | undefined {
  const idMatch = formTag.match(/id=(["']?)([^"'\s>]+)\1/);
  const nameMatch = formTag.match(/name=(["']?)([^"'\s>]+)\1/);
  return idMatch ? idMatch[2] : nameMatch ? nameMatch[2] : undefined;
}



