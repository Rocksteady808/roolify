import { NextResponse } from 'next/server';

/**
 * NEW MULTI-PAGE SITE SCANNER
 * 
 * This scanner:
 * 1. Fetches ALL pages from Webflow Pages API
 * 2. Downloads published HTML from each page
 * 3. Parses forms and their fields
 * 4. Tags each element with formId and page info
 * 5. Returns a flat array of ALL elements across ALL pages
 * 
 * No complex logic, no intermediate API calls, everything in one place.
 */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get('siteId');
  
  if (!siteId) {
    return NextResponse.json({ error: 'siteId parameter required' }, { status: 400 });
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Site Scanner] 🚀 Starting full site scan`);
  console.log(`[Site Scanner] 🆔 Site ID: ${siteId}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Step 1: Get all pages from Webflow
    const pages = await fetchAllPages(req, siteId);
    
    if (pages.length === 0) {
      console.warn(`[Site Scanner] ⚠️  No pages found, using fallback URLs`);
    }
    
    console.log(`[Site Scanner] 📄 Will scan ${pages.length} page(s)`);
    
    // Step 2: Scan each page and collect all elements
    const allElements: any[] = [];
    
    for (const page of pages) {
      console.log(`\n[Site Scanner] 📍 Scanning: ${page.title} (${page.slug})`);
      console.log(`[Site Scanner] 🔗 URL: ${page.url}`);
      
      const pageElements = await scanPageHTML(page.url, page.slug, page.title);
      
      console.log(`[Site Scanner] ✅ Found ${pageElements.length} elements on "${page.title}"`);
      
      allElements.push(...pageElements);
    }
    
    // Step 3: Log summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Site Scanner] 📊 SCAN COMPLETE`);
    console.log(`[Site Scanner] Total pages scanned: ${pages.length}`);
    console.log(`[Site Scanner] Total elements found: ${allElements.length}`);
    
    // Group by formId for summary
    const elementsByForm: Record<string, number> = {};
    allElements.forEach(el => {
      if (el.formId) {
        elementsByForm[el.formId] = (elementsByForm[el.formId] || 0) + 1;
      }
    });
    
    console.log(`[Site Scanner] Forms detected:`);
    Object.entries(elementsByForm).forEach(([formId, count]) => {
      console.log(`[Site Scanner]   - ${formId}: ${count} elements`);
    });
    
    console.log(`${'='.repeat(60)}\n`);
    
    return NextResponse.json({
      success: true,
      siteId,
      pagesScanned: pages.length,
      elementsFound: allElements.length,
      elements: allElements,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('[Site Scanner] ❌ Fatal error:', error);
    return NextResponse.json(
      { error: `Site scan failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Fetch all pages from Webflow Pages API
 * Falls back to common pages if API unavailable
 */
async function fetchAllPages(req: Request, siteId: string) {
  try {
    console.log(`[Site Scanner] 📡 Fetching pages from Webflow API...`);
    
    const baseUrl = req.url.split('/api')[0];
    const pagesResponse = await fetch(`${baseUrl}/api/webflow/site/${siteId}/pages`);
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      const pages = pagesData.pages || [];
      const siteInfo = pagesData.site;
      
      console.log(`[Site Scanner] ✅ Webflow API returned ${pages.length} pages`);
      
      // Build URLs for each page
      // ⚠️ IMPORTANT: Don't use previewUrl - it's often a screenshot URL
      // Use the site's shortName to construct the published URL
      if (!siteInfo?.shortName) {
        throw new Error('Site shortName not found in Webflow API response. Cannot construct site URL.');
      }
      const shortName = siteInfo.shortName;
      const publishedUrl = `https://${shortName}.webflow.io`;
      console.log(`[Site Scanner] Using published URL: ${publishedUrl} (from shortName: ${shortName})`);
      
      const pageList = pages
        .filter((page: any) => !page.archived && !page.draft) // Skip archived and draft pages (Webflow uses "draft" not "isDraft")
        .map((page: any) => ({
          slug: page.slug || 'home', // Treat null slug as homepage
          title: page.title || page.slug || 'Home',
          url: !page.slug || page.slug === 'index' || page.slug === '/' 
            ? publishedUrl 
            : `${publishedUrl}/${page.slug}`
        }));
      
      console.log(`[Site Scanner] Pages to scan: ${pageList.map((p: any) => p.slug).join(', ')}`);
      console.log(`[Site Scanner] Full page URLs:`);
      pageList.forEach((p: any) => {
        console.log(`[Site Scanner]   - ${p.slug}: ${p.url}`);
      });
      
      return pageList;
      
    } else {
      throw new Error(`Pages API returned ${pagesResponse.status}`);
    }
    
  } catch (error) {
    console.warn(`[Site Scanner] ⚠️  Could not fetch pages from API:`, error);
    console.warn(`[Site Scanner] 🔄 Attempting to get site URL from Sites API for homepage fallback`);
    
    // Fallback: Get site info from Sites API and scan just the homepage
    try {
      const baseUrl = req.url.split('/api')[0];
      const siteResponse = await fetch(`${baseUrl}/api/webflow/sites`);
      
      if (siteResponse.ok) {
        const sitesData = await siteResponse.json();
        const currentSite = sitesData.sites?.find((s: any) => s.id === siteId);
        
        if (currentSite?.shortName) {
          const publishedUrl = `https://${currentSite.shortName}.webflow.io`;
          console.log(`[Site Scanner] 📍 Fallback: Scanning homepage only at ${publishedUrl}`);
          console.warn(`[Site Scanner] ⚠️  To scan all pages, enable 'pages:read' permission in your Webflow app settings`);
          
          return [
            { slug: 'home', title: 'Home', url: publishedUrl }
          ];
        }
      }
    } catch (fallbackError) {
      console.error(`[Site Scanner] ❌ Fallback also failed:`, fallbackError);
    }
    
    // If everything fails, throw error with helpful message
    throw new Error(
      `Cannot determine site URL. Please ensure:\n` +
      `1. Your Webflow app has 'sites:read' and 'pages:read' permissions\n` +
      `2. The site is properly configured in Webflow\n` +
      `3. You have reinstalled the app with correct permissions`
    );
  }
}

/**
 * Scan a single page's HTML and extract all form elements
 */
async function scanPageHTML(pageUrl: string, pageSlug: string, pageTitle: string): Promise<any[]> {
  try {
    // Fetch the published HTML with cache-busting
    const fetchUrl = `${pageUrl}?_nocache=${Date.now()}`;
    
    console.log(`[Site Scanner]   📥 Fetching HTML...`);
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Roolify Scanner)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`[Site Scanner]   📄 Downloaded ${html.length} chars of HTML`);
    
    // Parse the HTML and extract elements
    const elements = parseHTML(html, pageSlug, pageTitle, pageUrl);
    
    console.log(`[Site Scanner]   🔍 Parsed ${elements.length} elements`);
    
    // Log a sample if we found any
    if (elements.length > 0) {
      console.log(`[Site Scanner]   Sample element:`, JSON.stringify(elements[0], null, 2));
    } else {
      console.warn(`[Site Scanner]   ⚠️  No elements found in HTML - check parsing logic`);
    }
    
    return elements;
    
  } catch (error) {
    console.error(`[Site Scanner]   ❌ Failed to scan page:`, error);
    return [];
  }
}

/**
 * Parse HTML and extract all form elements
 */
function parseHTML(html: string, pageSlug: string, pageTitle: string, pageUrl: string): any[] {
  const elements: any[] = [];
  const seenIds = new Set<string>();
  
  // Step 1: Find all <form> tags
  const forms = extractForms(html);
  
  console.log(`[Site Scanner]   📋 Found ${forms.length} form(s) in HTML`);
  
  // Step 2: For each form, extract its elements
  for (const form of forms) {
    console.log(`[Site Scanner]     🔍 Parsing form: ${form.formId} (${form.displayName})`);
    
    const formElements = extractElementsFromHTML(
      form.content, 
      form.formId, 
      form.displayName, // Use displayName instead of formName
      pageSlug,
      pageTitle,
      pageUrl,
      seenIds
    );
    
    console.log(`[Site Scanner]     ✓ Extracted ${formElements.length} elements from "${form.displayName}"`);
    
    elements.push(...formElements);
  }
  
  // Step 3: Also scan for elements outside forms (for show/hide targets)
  console.log(`[Site Scanner]   🔍 Now scanning for elements outside forms...`);
  const outsideElements = extractElementsFromHTML(
    html,
    undefined,
    undefined,
    pageSlug,
    pageTitle,
    pageUrl,
    seenIds
  );
  
  if (outsideElements.length > 0) {
    console.log(`[Site Scanner]   📦 Found ${outsideElements.length} elements outside forms`);
    elements.push(...outsideElements);
  } else {
    console.warn(`[Site Scanner]   ⚠️  No elements found outside forms either`);
  }
  
  console.log(`[Site Scanner] ✅ Total elements found on this page: ${elements.length}`);
  
  return elements;
}

/**
 * Extract <form> tags from HTML
 */
function extractForms(html: string): Array<{ formId: string; formName: string; displayName: string; content: string }> {
  const forms: Array<{ formId: string; formName: string; displayName: string; content: string }> = [];
  
  console.log(`[Site Scanner] 🔍 Searching for <form> tags in HTML...`);
  
  // Match <form id="..." ...>...</form>
  const formRegex = /<form([^>]*?)>([\s\S]*?)<\/form>/gi;
  let match;
  
  while ((match = formRegex.exec(html)) !== null) {
    const attributes = match[1];
    const content = match[2];
    
    // Extract form ID, name, and data-name (user-friendly display name)
    const formId = extractAttribute(attributes, 'id');
    const formName = extractAttribute(attributes, 'name') || formId || 'unknown';
    const dataName = extractAttribute(attributes, 'data-name');
    
    // Use data-name as display name (the user-friendly name from Webflow)
    // This removes the "-2" suffix that Webflow auto-generates
    const displayName = dataName || formName;
    
    console.log(`[Site Scanner] Found form tag: id="${formId || 'NO_ID'}", name="${formName}", displayName="${displayName}", content length=${content.length}`);
    
    if (formId) {
      forms.push({ formId, formName, displayName, content });
      console.log(`[Site Scanner] ✓ Added form: "${formId}" (displays as "${displayName}")`);
    } else {
      console.warn(`[Site Scanner] ⚠️  Skipped form without ID`);
    }
  }
  
  console.log(`[Site Scanner] Extracted ${forms.length} form(s) total`);
  
  return forms;
}

/**
 * Extract all input/select/textarea elements from HTML
 */
function extractElementsFromHTML(
  html: string,
  formId: string | undefined,
  formName: string | undefined,
  pageSlug: string,
  pageTitle: string,
  pageUrl: string,
  seenIds: Set<string>
): any[] {
  const elements: any[] = [];
  
  const context = formId ? `in form "${formId}"` : "outside forms";
  console.log(`[Site Scanner] 🔍 Extracting elements ${context}, HTML length: ${html.length}`);
  
  // Extract <input> elements
  const inputRegex = /<input([^>]*?)(?:id="([^"]+)")([^>]*?)(?:\/>|>)/gi;
  let match;
  let inputCount = 0;
  
  while ((match = inputRegex.exec(html)) !== null) {
    inputCount++;
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const fullAttrs = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const type = extractAttribute(fullAttrs, 'type') || 'text';
    const name = extractAttribute(fullAttrs, 'name') || id;
    const value = extractAttribute(fullAttrs, 'value') || '';
    
    // Skip submit buttons, reset buttons, and buttons
    if (type === 'submit' || type === 'reset' || type === 'button' || type === 'image') {
      continue;
    }
    
    elements.push({
      id,
      elementId: id,
      tagName: 'input',
      type,
      name,
      value,
      formId,
      formName,
      pageSlug,
      pageTitle,
      pageUrl,
      source: 'site-scanner'
    });
  }
  
  // Extract <select> elements
  const selectRegex = /<select([^>]*?)id="([^"]+)"([^>]*?)>([\s\S]*?)<\/select>/gi;
  
  while ((match = selectRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const content = match[4];
    const fullAttrs = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const name = extractAttribute(fullAttrs, 'name') || id;
    
    // Extract options
    const options: string[] = [];
    const optionRegex = /<option([^>]*)>([^<]+)<\/option>/gi;
    let optMatch;
    
    while ((optMatch = optionRegex.exec(content)) !== null) {
      const optionAttrs = optMatch[1];
      const optionText = optMatch[2].trim();
      const optionValue = extractAttribute(optionAttrs, 'value') || optionText;
      
      // Skip placeholder options
      if (optionValue && !optionValue.match(/^(Select|Choose|Pick|--)/i)) {
        options.push(optionValue);
      }
    }
    
    elements.push({
      id,
      elementId: id,
      tagName: 'select',
      type: 'select',
      name,
      options: options.length > 0 ? options : undefined,
      formId,
      formName,
      pageSlug,
      pageTitle,
      pageUrl,
      source: 'site-scanner'
    });
  }
  
  // Extract <textarea> elements
  const textareaRegex = /<textarea([^>]*?)id="([^"]+)"([^>]*?)>/gi;
  
  while ((match = textareaRegex.exec(html)) !== null) {
    const before = match[1] || '';
    const id = match[2];
    const after = match[3] || '';
    const fullAttrs = before + after;
    
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    const name = extractAttribute(fullAttrs, 'name') || id;
    
    elements.push({
      id,
      elementId: id,
      tagName: 'textarea',
      type: 'textarea',
      name,
      formId,
      formName,
      pageSlug,
      pageTitle,
      pageUrl,
      source: 'site-scanner'
    });
  }
  
  console.log(`[Site Scanner] ✓ Found ${inputCount} inputs ${context}`);
  console.log(`[Site Scanner] ✓ Total elements extracted ${context}: ${elements.length}`);
  
  return elements;
}

/**
 * Extract an attribute value from an HTML tag
 */
function extractAttribute(html: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

