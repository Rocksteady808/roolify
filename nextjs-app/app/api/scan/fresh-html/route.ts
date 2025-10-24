import { NextResponse } from 'next/server';

/**
 * FRESH HTML SCANNER - Simple & Reliable
 * 
 * This scanner:
 * 1. Fetches the published HTML directly (no cache)
 * 2. Finds ALL elements with IDs using regex
 * 3. Returns them immediately
 * 
 * No complex logic, no caching, no dependencies on Webflow API.
 */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteUrl = url.searchParams.get('url');
  
  if (!siteUrl) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }
  
  return scanFreshHTML(siteUrl);
}

export async function POST(req: Request) {
  const { url: siteUrl } = await req.json();
  
  if (!siteUrl) {
    return NextResponse.json({ error: 'url required in body' }, { status: 400 });
  }
  
  return scanFreshHTML(siteUrl);
}

async function scanFreshHTML(siteUrl: string) {
  console.log(`\n========================================`);
  console.log(`[Fresh HTML Scanner] 🚀 Starting fresh scan`);
  console.log(`[Fresh HTML Scanner] 📍 URL: ${siteUrl}`);
  console.log(`========================================\n`);
  
  try {
    // Step 1: Fetch the published HTML with cache-busting
    const fetchUrl = `${siteUrl}?_nocache=${Date.now()}`;
    console.log(`[Fresh HTML Scanner] 📥 Fetching HTML: ${fetchUrl}`);
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Roolify Scanner)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`[Fresh HTML Scanner] ✅ Fetched ${html.length} characters of HTML`);
    
    // Step 2: Extract ALL elements with IDs
    const elements = extractAllElements(html);
    
    console.log(`\n[Fresh HTML Scanner] 📊 SCAN RESULTS:`);
    console.log(`[Fresh HTML Scanner] Total elements found: ${elements.length}`);
    
    // Group by type for summary
    const byType: Record<string, number> = {};
    elements.forEach(el => {
      const type = el.type || el.tagName || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log(`[Fresh HTML Scanner] Breakdown by type:`);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`[Fresh HTML Scanner]   - ${type}: ${count}`);
    });
    
    // List all checkboxes explicitly
    const checkboxes = elements.filter(el => el.type === 'checkbox');
    if (checkboxes.length > 0) {
      console.log(`\n[Fresh HTML Scanner] 📋 CHECKBOXES FOUND:`);
      checkboxes.forEach(cb => {
        console.log(`[Fresh HTML Scanner]   ✓ ${cb.id} (name: ${cb.name})`);
      });
    }
    
    console.log(`\n========================================`);
    console.log(`[Fresh HTML Scanner] ✅ Scan complete`);
    console.log(`========================================\n`);
    
    return NextResponse.json({
      success: true,
      url: siteUrl,
      elementsFound: elements.length,
      elements,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('[Fresh HTML Scanner] ❌ Error:', error);
    return NextResponse.json(
      { error: `Scan failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

function extractAllElements(html: string) {
  const elements: any[] = [];
  const seenIds = new Set<string>();
  
  console.log(`[Fresh HTML Scanner] 🔍 Extracting elements from HTML...`);
  
  // STEP 1: Extract all <form> tags with their IDs and content
  const forms = extractForms(html);
  console.log(`[Fresh HTML Scanner] 📋 Found ${forms.length} form(s)`);
  
  // STEP 2: For each form, scan its content and associate elements with formId
  for (const form of forms) {
    console.log(`[Fresh HTML Scanner] 🔍 Scanning form: ${form.formId}`);
    const formElements = scanHTMLForElements(form.content, form.formId, form.formName, seenIds);
    elements.push(...formElements);
  }
  
  // STEP 3: Scan for elements outside forms (fallback/additional elements)
  console.log(`[Fresh HTML Scanner] 🔍 Scanning for elements outside forms...`);
  const outsideElements = scanHTMLForElements(html, undefined, undefined, seenIds);
  elements.push(...outsideElements);
  
  console.log(`[Fresh HTML Scanner] ✅ Extraction complete: ${elements.length} elements`);
  
  return elements;
}

/**
 * Extract all <form> tags with their IDs and inner HTML
 */
function extractForms(html: string): Array<{ formId: string; formName: string; content: string }> {
  const forms: Array<{ formId: string; formName: string; content: string }> = [];
  
  // Match <form id="..." name="...">...</form>
  const formRegex = /<form([^>]*?)>([\s\S]*?)<\/form>/gi;
  let match;
  
  while ((match = formRegex.exec(html)) !== null) {
    const attributes = match[1];
    const content = match[2];
    
    // Extract form ID
    const formId = extractAttr(attributes, 'id');
    const formName = extractAttr(attributes, 'name') || formId || 'unknown-form';
    
    if (formId) {
      forms.push({
        formId,
        formName,
        content
      });
      console.log(`[Fresh HTML Scanner]   Found form: id="${formId}", name="${formName}"`);
    }
  }
  
  return forms;
}

/**
 * Scan HTML content for form elements
 */
function scanHTMLForElements(
  html: string, 
  formId: string | undefined, 
  formName: string | undefined,
  seenIds: Set<string>
): any[] {
  const elements: any[] = [];
  
  // Find ALL <input> elements with IDs (self-closing or not)
  const inputRegex = /<input([^>]*?)(?:id="([^"]+)")([^>]*?)(?:\/>|>)/gi;
  let match;
  
  while ((match = inputRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const fullTag = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    // Extract attributes
    const type = extractAttr(fullTag, 'type') || 'text';
    const name = extractAttr(fullTag, 'name') || id;
    const value = extractAttr(fullTag, 'value') || '';
    
    elements.push({
      id,
      tagName: 'input',
      type,
      name,
      value,
      formId,
      formName,
      source: 'fresh-html-scan'
    });
    
    if (formId) {
      console.log(`[Fresh HTML Scanner]     ✓ Input in form "${formId}": id="${id}", type="${type}", name="${name}"`);
    }
  }
  
  // Find ALL <select> elements with IDs
  const selectRegex = /<select([^>]*?)id="([^"]+)"([^>]*?)>([\s\S]*?)<\/select>/gi;
  
  while ((match = selectRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const content = match[4];
    const fullTag = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const name = extractAttr(fullTag, 'name') || id;
    
    // Extract options (BOTH value and text for better matching)
    const options: string[] = [];
    // Match <option value="...">text</option>
    const optionRegex = /<option([^>]*)>([^<]+)<\/option>/gi;
    let optMatch;
    
    while ((optMatch = optionRegex.exec(content)) !== null) {
      const optionAttrs = optMatch[1];
      const optionText = optMatch[2].trim();
      
      // Extract value attribute if it exists
      const optionValue = extractAttr(optionAttrs, 'value');
      
      // Use value if available, otherwise use text
      const finalValue = optionValue || optionText;
      
      // Skip placeholder options (Select..., Choose..., etc.)
      if (finalValue && !finalValue.match(/^(Select|Choose|Pick|--)/i) && !optionText.match(/^(Select|Choose|Pick|--)/i)) {
        options.push(finalValue);
      }
    }
    
    elements.push({
      id,
      tagName: 'select',
      type: 'select',
      name,
      options: options.length > 0 ? options : undefined,
      formId,
      formName,
      source: 'fresh-html-scan'
    });
    
    if (formId) {
      console.log(`[Fresh HTML Scanner]     ✓ Select in form "${formId}": id="${id}", name="${name}", options: [${options.join(', ')}]`);
    }
  }
  
  // Find ALL <textarea> elements with IDs
  const textareaRegex = /<textarea([^>]*?)id="([^"]+)"([^>]*?)>/gi;
  
  while ((match = textareaRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const fullTag = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const name = extractAttr(fullTag, 'name') || id;
    
    elements.push({
      id,
      tagName: 'textarea',
      type: 'textarea',
      name,
      formId,
      formName,
      source: 'fresh-html-scan'
    });
    
    if (formId) {
      console.log(`[Fresh HTML Scanner]     ✓ Textarea in form "${formId}": id="${id}", name="${name}"`);
    }
  }
  
  // Find ALL <button> elements with IDs (but skip submit/reset buttons)
  const buttonRegex = /<button([^>]*?)id="([^"]+)"([^>]*?)>/gi;
  
  while ((match = buttonRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const fullTag = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const type = extractAttr(fullTag, 'type') || 'button';
    const name = extractAttr(fullTag, 'name') || id;
    
    // Skip submit and reset buttons - they're not form fields
    if (type === 'submit' || type === 'reset') {
      continue;
    }
    
    elements.push({
      id,
      tagName: 'button',
      type,
      name,
      formId,
      formName,
      source: 'fresh-html-scan'
    });
    
    if (formId) {
      console.log(`[Fresh HTML Scanner]     ✓ Button in form "${formId}": id="${id}", type="${type}"`);
    }
  }
  
  // Find ALL <div>, <span>, etc. with IDs (for show/hide targets)
  const divRegex = /<(div|span|section|article|aside|header|footer|main)([^>]*?)id="([^"]+)"([^>]*?)>/gi;
  
  while ((match = divRegex.exec(html)) !== null) {
    const tagName = match[1];
    const before = match[2] || '';
    const id = match[3];
    const after = match[4] || '';
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    elements.push({
      id,
      tagName,
      type: tagName,
      name: id,
      isContainer: true,
      formId,
      formName,
      source: 'fresh-html-scan'
    });
    
    if (formId) {
      console.log(`[Fresh HTML Scanner]     ✓ Container in form "${formId}": id="${id}", tag="${tagName}"`);
    }
  }
  
  return elements;
}

function extractAttr(html: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

