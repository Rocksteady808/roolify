import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`[Scan Site Options] Scanning ${url} for select options`);

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
    console.log(`[Scan Site Options] Fetched ${html.length} characters of HTML`);

    // ADD DEBUG LOG
    console.log(`[Scan Site Options] 🔍 Sample HTML (first 2000 chars):`, html.substring(0, 2000));

    // Extract select elements with their options
    const selectElements = extractSelectElements(html);
    console.log(`[Scan Site Options] Found ${selectElements.length} select elements`);
    
    // ADD DEBUG LOG
    if (selectElements.length > 0) {
      console.log(`[Scan Site Options] ✅ Select elements found:`, JSON.stringify(selectElements, null, 2));
    } else {
      console.log(`[Scan Site Options] ⚠️ NO select elements found - checking HTML structure...`);
      // Check if select tags exist at all
      const hasSelectTags = html.includes('<select');
      console.log(`[Scan Site Options] HTML contains <select tags:`, hasSelectTags);
    }

    return NextResponse.json({
      success: true,
      selectElements,
      url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Scan Site Options] Error:', error);
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

  // ADD DEBUG LOG
  console.log(`[Scan Site Options] 🔍 Starting extraction...`);
  
  // Find all select elements with IDs
  const selectRegex = /<select\b[^>]*\bid=(["']?)([^"'\s>]+)\1[^>]*>([\s\S]*?)<\/select>/gi;
  let match;
  let matchCount = 0;

  while ((match = selectRegex.exec(html)) !== null) {
    matchCount++;
    console.log(`[Scan Site Options] 🔍 Found select #${matchCount}:`, {
      id: match[2],
      fullMatch: match[0].substring(0, 200) // First 200 chars
    });
    
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
          optionText !== 'Select Country' &&
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
      console.log(`[Scan Site Options] ✅ Added select element "${selectName}" with ${options.length} options`);
    } else {
      console.log(`[Scan Site Options] ⚠️ Select element "${selectName}" has no options`);
    }
  }

  console.log(`[Scan Site Options] 🔍 Extraction complete. Total elements: ${selectElements.length}`);
  return selectElements;
}

function extractFormId(formTag: string): string | undefined {
  const idMatch = formTag.match(/id=(["']?)([^"'\s>]+)\1/);
  const nameMatch = formTag.match(/name=(["']?)([^"'\s>]+)\1/);
  return idMatch ? idMatch[2] : nameMatch ? nameMatch[2] : undefined;
}



