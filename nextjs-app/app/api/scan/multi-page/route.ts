import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Support GET requests with query parameters for easy testing
  const url = new URL(req.url);
  const baseUrl = url.searchParams.get('baseUrl');
  const siteId = url.searchParams.get('siteId');
  
  if (!baseUrl) {
    return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
  }
  
  return scanSite(baseUrl, siteId || '');
}

export async function POST(req: Request) {
  try {
    const { baseUrl, siteId } = await req.json();

    if (!baseUrl) {
      return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
    }
    
    return scanSite(baseUrl, siteId);

  } catch (error) {
    console.error('[Multi-Page Scanner] Error:', error);
    return NextResponse.json(
      { error: `Multi-page scan failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

async function scanSite(baseUrl: string, siteId: string) {
  try {
    console.log(`[Multi-Page Scanner] Starting comprehensive scan of ${baseUrl}`);

    // Step 1: Try to discover pages using common patterns
    const discoveredPages = await discoverPages(baseUrl);
    console.log(`[Multi-Page Scanner] Discovered ${discoveredPages.length} pages`);

    // Step 2: Scan each page for forms and elements
    const allForms = [];
    const allElements = [];
    const pageResults = [];

    for (const pageUrl of discoveredPages) {
      try {
        console.log(`[Multi-Page Scanner] Scanning page: ${pageUrl}`);
        
        const pageResult = await scanPageForForms(pageUrl);
        if (pageResult.forms.length > 0 || pageResult.elements.length > 0) {
          pageResults.push({
            url: pageUrl,
            forms: pageResult.forms,
            elements: pageResult.elements,
            timestamp: new Date().toISOString()
          });
          
          allForms.push(...pageResult.forms);
          allElements.push(...pageResult.elements);
        }
        
        console.log(`[Multi-Page Scanner] Found ${pageResult.forms.length} forms and ${pageResult.elements.length} elements on ${pageUrl}`);
        
      } catch (error) {
        console.error(`[Multi-Page Scanner] Error scanning ${pageUrl}:`, error);
        continue;
      }
    }

    // Step 3: Deduplicate and merge results
    const uniqueForms = deduplicateForms(allForms);
    const uniqueElements = deduplicateElements(allElements);

    console.log(`[Multi-Page Scanner] Total unique forms found: ${uniqueForms.length}`);
    console.log(`[Multi-Page Scanner] Total unique elements found: ${uniqueElements.length}`);

    return NextResponse.json({
      success: true,
      baseUrl,
      siteId,
      pagesScanned: discoveredPages.length,
      pagesWithContent: pageResults.length,
      totalForms: uniqueForms.length,
      totalElements: uniqueElements.length,
      forms: uniqueForms,
      elements: uniqueElements,
      pageResults,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Multi-Page Scanner] Error:', error);
    return NextResponse.json(
      { error: `Multi-page scan failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

async function discoverPages(baseUrl: string): Promise<string[]> {
  const discoveredPages = new Set<string>();
  discoveredPages.add(baseUrl); // Always include the main page
  
  console.log('[Page Discovery] Starting dynamic page discovery...');
  
  // Step 1: Try to find and parse sitemap.xml
  const sitemapPages = await discoverFromSitemap(baseUrl);
  sitemapPages.forEach(page => discoveredPages.add(page));
  console.log(`[Page Discovery] Found ${sitemapPages.length} pages from sitemap`);
  
  // Step 2: Crawl the homepage to find internal links
  const crawledPages = await crawlPageForLinks(baseUrl, baseUrl);
  crawledPages.forEach(page => discoveredPages.add(page));
  console.log(`[Page Discovery] Found ${crawledPages.length} pages from crawling homepage`);
  
  // Step 3: If we found very few pages, try crawling discovered pages (up to 2 levels deep)
  if (discoveredPages.size < 10) {
    const pagesToCrawl = Array.from(discoveredPages).slice(0, 5); // Limit to avoid too many requests
    for (const page of pagesToCrawl) {
      const additionalPages = await crawlPageForLinks(page, baseUrl);
      additionalPages.forEach(p => discoveredPages.add(p));
    }
    console.log(`[Page Discovery] After deeper crawl: ${discoveredPages.size} total pages`);
  }
  
  // Step 4: If still very few pages, try common testing/development patterns
  if (discoveredPages.size < 5) {
    console.log(`[Page Discovery] Very few pages found (${discoveredPages.size}), trying common testing patterns...`);
    const testingPatterns = [
      '/testing', '/testing-1', '/testing-2', '/testing-3',
      '/test', '/test-1', '/test-2', '/test-3',
      '/dev', '/development', '/staging', '/preview',
      '/demo', '/sample', '/example'
    ];
    
    for (const pattern of testingPatterns) {
      const testUrl = `${baseUrl}${pattern}`;
      try {
        const response = await fetch(testUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)' },
        });
        if (response.ok) {
          discoveredPages.add(testUrl);
          console.log(`[Page Discovery] Found testing page: ${testUrl}`);
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
    console.log(`[Page Discovery] After testing patterns: ${discoveredPages.size} total pages`);
  }
  
  console.log(`[Page Discovery] Total pages discovered: ${discoveredPages.size}`);
  return Array.from(discoveredPages);
}

async function discoverFromSitemap(baseUrl: string): Promise<string[]> {
  const pages: string[] = [];
  
  try {
    // Try common sitemap locations
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap1.xml`
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)' },
        });
        
        if (response.ok) {
          const xml = await response.text();
          
          // Extract URLs from sitemap
          const urlRegex = /<loc>(.*?)<\/loc>/g;
          let match;
          while ((match = urlRegex.exec(xml)) !== null) {
            const url = match[1].trim();
            // Only include pages from the same domain
            if (url.startsWith(baseUrl)) {
              pages.push(url);
            }
          }
          
          if (pages.length > 0) {
            console.log(`[Sitemap Discovery] Found ${pages.length} URLs in ${sitemapUrl}`);
            break; // Found a valid sitemap, no need to try others
          }
        }
      } catch (error) {
        // Continue to next sitemap URL
        continue;
      }
    }
  } catch (error) {
    console.log('[Sitemap Discovery] No sitemap found, will use crawling');
  }
  
  return pages;
}

async function crawlPageForLinks(pageUrl: string, baseUrl: string): Promise<string[]> {
  const pages: string[] = [];
  
  try {
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)' },
    });
    
    if (!response.ok) {
      return pages;
    }
    
    const html = await response.text();
    
    // Extract all links from the page
    const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1].trim();
      
      // Skip anchors, mailto, tel, javascript, etc.
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || 
          href.startsWith('javascript:') || href === '') {
        continue;
      }
      
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = baseUrl + href;
      } else if (!href.startsWith('http')) {
        // Skip relative paths that don't start with /
        continue;
      }
      
      // Only include pages from the same domain
      if (href.startsWith(baseUrl)) {
        // Remove query strings and fragments for cleaner URLs
        const cleanUrl = href.split('?')[0].split('#')[0];
        if (cleanUrl && !pages.includes(cleanUrl)) {
          pages.push(cleanUrl);
        }
      }
    }
  } catch (error) {
    console.error(`[Page Crawling] Error crawling ${pageUrl}:`, error);
  }
  
  return pages;
}

async function scanPageForForms(pageUrl: string) {
  try {
    // Fetch the page with cache busting to ensure we get the latest published version
    const cacheBustUrl = pageUrl.includes('?') 
      ? `${pageUrl}&_t=${Date.now()}` 
      : `${pageUrl}?_t=${Date.now()}`;
    
    const response = await fetch(cacheBustUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    if (!response.ok) {
      return { forms: [], elements: [] };
    }

    const html = await response.text();
    
    // Extract forms
    const forms = extractFormsFromHTML(html, pageUrl);
    
    // Extract elements with IDs
    const elements = extractElementsFromHTML(html, pageUrl);
    
    // Also extract wrapper divs from forms and add to elements array
    forms.forEach(form => {
      if (form.wrapperDivs && Array.isArray(form.wrapperDivs)) {
        form.wrapperDivs.forEach((wrapper: any) => {
          // Check if this wrapper already exists in elements (to avoid duplicates)
          const existingIndex = elements.findIndex(el => el.id === wrapper.id);
          
          const wrapperElement = {
            id: wrapper.id,
            name: wrapper.displayName || wrapper.name, // Prioritize displayName (label text)
            displayName: wrapper.displayName, // The label text or best display name
            type: wrapper.type,
            tagName: 'div',
            pageUrl: pageUrl,
            formId: wrapper.formId, // Attach form ID for precise matching
            formName: wrapper.formName,
            fieldName: wrapper.fieldName, // The actual form field name attribute
            isFormWrapper: true
          };
          
          if (existingIndex >= 0) {
            // Replace existing element with enhanced wrapper data
            elements[existingIndex] = wrapperElement;
            console.log(`[Multi-Page Scanner] Enhanced existing element ${wrapper.id} with wrapper data`);
          } else {
            // Add new wrapper element
            elements.push(wrapperElement);
          }
        });
      }
    });
    
    return { forms, elements };
    
  } catch (error) {
    console.error(`Error scanning page ${pageUrl}:`, error);
    return { forms: [], elements: [] };
  }
}

function extractFormsFromHTML(html: string, pageUrl: string) {
  const forms = [];
  
  // Find all form elements
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
  let formMatch;
  let formIndex = 0;

  while ((formMatch = formRegex.exec(html)) !== null) {
    const formHtml = formMatch[0];
    const formContent = formMatch[1];
    
    // Extract form attributes
    const formId = extractAttribute(formHtml, 'id') || `form-${formIndex}`;
    const formName = extractAttribute(formHtml, 'data-name') || extractAttribute(formHtml, 'name') || formId; // Prioritize data-name (Webflow's display name)
    const formAction = extractAttribute(formHtml, 'action') || '';
    const formMethod = extractAttribute(formHtml, 'method') || 'get';
    
    console.log(`[Form Extraction] Found form: id="${formId}", name="${formName}", data-name="${extractAttribute(formHtml, 'data-name')}"`);

    
    // Extract form fields
    const fields = extractFormFields(formContent);
    
    // Extract form wrapper divs with IDs and tag them with form info
    const wrapperDivs = extractWrapperDivs(formContent, formId, formName);
    
    forms.push({
      id: formId,
      name: formName,
      action: formAction,
      method: formMethod,
      fields: fields,
      wrapperDivs: wrapperDivs,
      pageUrl: pageUrl,
      source: 'html-scan'
    });
    
    formIndex++;
  }
  
  return forms;
}

function extractFormFields(formContent: string) {
  const fields = [];
  const radioGroups = new Map(); // Track radio button groups
  
  // Extract input fields
  const inputRegex = /<input[^>]*>/gi;
  let inputMatch;
  while ((inputMatch = inputRegex.exec(formContent)) !== null) {
    const inputHtml = inputMatch[0];
    const field = extractFieldFromInput(inputHtml);
    if (field) {
      // Group radio buttons by name
      if (field.type === 'radio') {
        const groupName = field.name;
        if (!radioGroups.has(groupName)) {
          radioGroups.set(groupName, {
            id: groupName,
            name: groupName,
            displayName: groupName,
            type: 'radio',
            required: field.required,
            options: [],
            elementType: 'radio'
          });
        }
        // Add this radio button's value to the options
        if (field.value) {
          radioGroups.get(groupName).options.push(field.value);
        }
      } else {
        fields.push(field);
      }
    }
  }
  
  // Add radio button groups to fields
  radioGroups.forEach((radioGroup) => {
    fields.push(radioGroup);
  });
  
  // Extract select fields
  const selectRegex = /<select[^>]*>([\s\S]*?)<\/select>/gi;
  let selectMatch;
  while ((selectMatch = selectRegex.exec(formContent)) !== null) {
    const selectHtml = selectMatch[0];
    const selectContent = selectMatch[1];
    const field = extractFieldFromSelect(selectHtml, selectContent);
    if (field) fields.push(field);
  }
  
  // Extract textarea fields
  const textareaRegex = /<textarea[^>]*>([\s\S]*?)<\/textarea>/gi;
  let textareaMatch;
  while ((textareaMatch = textareaRegex.exec(formContent)) !== null) {
    const textareaHtml = textareaMatch[0];
    const field = extractFieldFromTextarea(textareaHtml);
    if (field) fields.push(field);
  }
  
  return fields;
}

function extractFieldFromInput(inputHtml: string) {
  const id = extractAttribute(inputHtml, 'id');
  const name = extractAttribute(inputHtml, 'name');
  const type = extractAttribute(inputHtml, 'type') || 'text';
  const placeholder = extractAttribute(inputHtml, 'placeholder');
  const value = extractAttribute(inputHtml, 'value');
  const required = inputHtml.includes('required');
  
  if (!id && !name) return null;
  
  return {
    id: id || name,
    name: name || id,
    type: type,
    placeholder: placeholder || '',
    value: value || '',
    required: required,
    elementType: 'input'
  };
}

function extractFieldFromSelect(selectHtml: string, selectContent: string) {
  const id = extractAttribute(selectHtml, 'id');
  const name = extractAttribute(selectHtml, 'name');
  const dataName = extractAttribute(selectHtml, 'data-name');
  const required = selectHtml.includes('required');
  
  if (!id && !name) return null;
  
  // Extract options - improved regex to handle various formats
  const options = [];
  const optionRegex = /<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi;
  let optionMatch;
  
  while ((optionMatch = optionRegex.exec(selectContent)) !== null) {
    const optionValue = optionMatch[1].trim();
    const optionText = optionMatch[2].trim();
    
    // Use the text content, skip empty values or placeholder text
    if (optionText && optionValue && 
        optionText !== 'Select' && optionText !== 'Select...' && 
        optionText !== 'Choose' && optionText !== 'Choose...') {
      options.push(optionText);
    }
  }
  
  // Also try simple option extraction if no options found with value attribute
  if (options.length === 0) {
    const simpleOptionRegex = /<option[^>]*>([^<]+)<\/option>/gi;
    let simpleMatch;
    while ((simpleMatch = simpleOptionRegex.exec(selectContent)) !== null) {
      const optionText = simpleMatch[1].trim();
      if (optionText && 
          optionText !== 'Select' && optionText !== 'Select...' && 
          optionText !== 'Choose' && optionText !== 'Choose...') {
        options.push(optionText);
      }
    }
  }
  
  console.log(`[Select Field Extraction] Field: ${dataName || name || id}, Options found: ${options.length}`);
  if (options.length > 0) {
    console.log(`[Select Field Extraction] Options: ${options.slice(0, 3).join(', ')}${options.length > 3 ? '...' : ''}`);
  }
  
  return {
    id: id || name,
    name: name || id,
    displayName: dataName || name || id,
    type: 'select',
    required: required,
    options: options,
    elementType: 'select'
  };
}

function extractFieldFromTextarea(textareaHtml: string) {
  const id = extractAttribute(textareaHtml, 'id');
  const name = extractAttribute(textareaHtml, 'name');
  const placeholder = extractAttribute(textareaHtml, 'placeholder');
  const required = textareaHtml.includes('required');
  
  if (!id && !name) return null;
  
  return {
    id: id || name,
    name: name || id,
    type: 'textarea',
    placeholder: placeholder || '',
    required: required,
    elementType: 'textarea'
  };
}

function extractWrapperDivs(formContent: string, formId: string, formName: string) {
  const wrapperDivs = [];
  
  // Find divs with IDs that contain form elements
  const divRegex = /<div[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/div>/gi;
  let divMatch;
  
  while ((divMatch = divRegex.exec(formContent)) !== null) {
    const divId = divMatch[1];
    const divContent = divMatch[2];
    
    // Check if this div contains form elements
    if (divContent.includes('<input') || divContent.includes('<select') || divContent.includes('<textarea')) {
      // Extract the actual form field name from inside the div
      let fieldName = null;
      let fieldType = null;
      let fieldDataName = null;
      let labelText = null;
      
      // Try to extract label text first (this is the user-friendly display name)
      const labelMatch = divContent.match(/<label[^>]*>([^<]+)<\/label>/i);
      if (labelMatch) {
        labelText = labelMatch[1].trim();
      }
      
      // Try to find input field name
      // IMPORTANT: Match ONLY "name" attribute, not "data-name" (use space or < before "name")
      const inputMatch = divContent.match(/<input[^>]*[\s]name\s*=\s*["']([^"']*)["'][^>]*>/i);
      if (inputMatch) {
        fieldName = inputMatch[1];
        const inputTypeMatch = divContent.match(/<input[^>]*type\s*=\s*["']([^"']*)["'][^>]*>/i);
        fieldType = inputTypeMatch ? inputTypeMatch[1] : 'text';
        const inputDataNameMatch = divContent.match(/<input[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
        fieldDataName = inputDataNameMatch ? inputDataNameMatch[1] : null;
      }
      
      // Try to find select field name
      if (!fieldName) {
        const selectMatch = divContent.match(/<select[^>]*[\s]name\s*=\s*["']([^"']*)["'][^>]*>/i);
        if (selectMatch) {
          fieldName = selectMatch[1];
          fieldType = 'select';
          const selectDataNameMatch = divContent.match(/<select[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
          fieldDataName = selectDataNameMatch ? selectDataNameMatch[1] : null;
        }
      }
      
      // Try to find textarea field name
      if (!fieldName) {
        const textareaMatch = divContent.match(/<textarea[^>]*[\s]name\s*=\s*["']([^"']*)["'][^>]*>/i);
        if (textareaMatch) {
          fieldName = textareaMatch[1];
          fieldType = 'textarea';
          const textareaDataNameMatch = divContent.match(/<textarea[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
          fieldDataName = textareaDataNameMatch ? textareaDataNameMatch[1] : null;
        }
      }
      
      const wrapper = {
        id: divId,
        name: fieldDataName || fieldName || divId, // Use data-name, then name, then fall back to div ID
        fieldName: fieldName, // Actual form field name attribute
        displayName: labelText || fieldDataName || fieldName || divId, // PRIORITIZE label text, then data-name, then name, then div ID
        type: fieldType || 'form-wrapper',
        content: divContent.trim().substring(0, 100),
        formId: formId, // Tag with parent form ID
        formName: formName // Tag with parent form name
      };
      
      wrapperDivs.push(wrapper);
    }
  }
  
  return wrapperDivs;
}

function extractElementsFromHTML(html: string, pageUrl: string) {
  const elements = [];
  
  console.log(`[Element Scanner] 🔍 Scanning HTML from ${pageUrl} (${html.length} chars)`);
  
  // Find all elements with IDs (with closing tags)
  const idRegex = /<(\w+)[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi;
  let elementMatch;
  
  while ((elementMatch = idRegex.exec(html)) !== null) {
    const tagName = elementMatch[1];
    const elementId = elementMatch[2];
    const elementContent = elementMatch[3];
    
    // Extract options for select elements
    let options = [];
    if (tagName === 'select') {
      const optionRegex = /<option[^>]*>([^<]+)<\/option>/gi;
      let optionMatch;
      while ((optionMatch = optionRegex.exec(elementContent)) !== null) {
        const optionText = optionMatch[1].trim();
        if (optionText && optionText !== 'Select...' && optionText !== 'Choose...') {
          options.push(optionText);
        }
      }
    }
    
    elements.push({
      id: elementId,
      tagName: tagName,
      content: elementContent.trim().substring(0, 100),
      options: options.length > 0 ? options : undefined,
      pageUrl: pageUrl,
      source: 'html-scan'
    });
    console.log(`[Element Scanner] Found ${tagName}: id="${elementId}"`);
  }
  
  // ALSO find self-closing input elements with IDs (for checkboxes, radios, text inputs)
  const selfClosingInputRegex = /<input([^>]*)id="([^"]*)"([^>]*)\/?\s*>/gi;
  let inputMatch;
  
  console.log(`[Element Scanner] 🔍 Now scanning for self-closing <input> elements...`);
  
  while ((inputMatch = selfClosingInputRegex.exec(html)) !== null) {
    const beforeId = inputMatch[1];
    const elementId = inputMatch[2];
    const afterId = inputMatch[3];
    const fullInput = beforeId + afterId;
    
    // Extract type attribute
    const typeMatch = fullInput.match(/type\s*=\s*["']([^"']*)["']/i);
    const inputType = typeMatch ? typeMatch[1] : 'text';
    
    // Extract name attribute
    const nameMatch = fullInput.match(/name\s*=\s*["']([^"']*)["']/i);
    const inputName = nameMatch ? nameMatch[1] : elementId;
    
    // Check if we already added this element (avoid duplicates from closing tag regex)
    const existingIndex = elements.findIndex(el => el.id === elementId);
    if (existingIndex === -1) {
      elements.push({
        id: elementId,
        tagName: 'input',
        type: inputType,  // Use 'type' instead of 'inputType' so frontend filter works
        name: inputName,
        content: '',
        pageUrl: pageUrl,
        source: 'html-scan'
      });
      console.log(`[Element Scanner] ✅ Found self-closing input: id="${elementId}", type="${inputType}", name="${inputName}"`);
    } else {
      console.log(`[Element Scanner] ⏭️  Skipping duplicate: id="${elementId}"`);
    }
  }
  
  console.log(`[Element Scanner] ✅ Total elements found: ${elements.length}`);
  
  return elements;
}

function extractAttribute(html: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function deduplicateForms(forms: any[]) {
  const seen = new Set();
  return forms.filter(form => {
    const key = `${form.id}-${form.name}-${form.pageUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateElements(elements: any[]) {
  const seen = new Set();
  return elements.filter(element => {
    const key = `${element.id}-${element.tagName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

