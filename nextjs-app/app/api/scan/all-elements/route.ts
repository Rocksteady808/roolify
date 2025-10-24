import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`[Scan All Elements] Scanning ${url} for all elements with IDs`);

    // If it's a main domain, also try common page paths
    const urlsToScan = [url];
    
    // If it's the main domain, try common page paths
    if (url.includes('flow-forms-f8b3f7.webflow.io') && !url.includes('/')) {
      const baseUrl = url;
      const commonPaths = [
        '/hbi',
        '/hbi-form',
        '/hbi-international',
        '/contact',
        '/inquiry',
        '/forms',
        '/account',
        '/signup',
        '/new-account'
      ];
      
      for (const path of commonPaths) {
        urlsToScan.push(`${baseUrl}${path}`);
      }
    }

    let allElements: any[] = [];

    // Scan each URL
    for (const scanUrl of urlsToScan) {
      try {
        console.log(`[Scan All Elements] Scanning ${scanUrl}`);
        
        // Fetch the page HTML
        const response = await fetch(scanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Roolify/1.0)',
          },
        });

        if (!response.ok) {
          console.log(`[Scan All Elements] Failed to fetch ${scanUrl}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        console.log(`[Scan All Elements] Fetched ${html.length} characters from ${scanUrl}`);

        // Extract ALL elements with IDs
        const elements = extractAllElementsWithIds(html);
        
        // Add source URL to each element
        elements.forEach(el => {
          el.sourceUrl = scanUrl;
        });

        allElements = allElements.concat(elements);
        console.log(`[Scan All Elements] Found ${elements.length} elements with IDs from ${scanUrl}`);

      } catch (error) {
        console.error(`[Scan All Elements] Error scanning ${scanUrl}:`, error);
        continue;
      }
    }

    // Remove duplicates based on ID
    const uniqueElements = allElements.reduce((acc: any[], current) => {
      const existing = acc.find((item: any) => item.id === current.id);
      if (!existing) {
        acc.push(current);
      } else {
        // Keep the one with more options or from the main page
        if (current.options && current.options.length > (existing.options?.length || 0)) {
          const index = acc.findIndex((item: any) => item.id === current.id);
          acc[index] = current;
        }
      }
      return acc;
    }, []);

    console.log(`[Scan All Elements] Found ${uniqueElements.length} unique elements with IDs`);

    return NextResponse.json({
      success: true,
      elements: uniqueElements,
      url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Scan All Elements] Error:', error);
    return NextResponse.json(
      { error: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function extractAllElementsWithIds(html: string) {
  const elements: Array<{
    id: string;
    tagName: string;
    type?: string;
    options?: string[];
    text?: string;
    formId?: string;
    sourceUrl?: string;
  }> = [];

  // Find all elements with IDs (any tag) - simpler approach
  const elementRegex = /<(\w+)\b[^>]*\bid=(["']?)([^"'\s>]+)\2[^>]*>/gi;
  let match;

  while ((match = elementRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const elementId = match[3];
    const fullTag = match[0];
    
    const element: any = {
      id: elementId,
      tagName: tagName,
      text: fullTag.trim().substring(0, 100) // First 100 chars of tag
    };

    // For select elements, extract options from the full HTML
    if (tagName === 'select') {
      const options: string[] = [];
      // Find the select element in the HTML and extract its options
      const selectStart = html.indexOf(fullTag);
      if (selectStart !== -1) {
        // Find the closing select tag
        const selectEnd = html.indexOf('</select>', selectStart);
        if (selectEnd !== -1) {
          const selectContent = html.substring(selectStart, selectEnd + 9);
          const optionRegex = /<option\b[^>]*>([^<]+)<\/option>/gi;
          let optionMatch;

          while ((optionMatch = optionRegex.exec(selectContent)) !== null) {
            const optionText = optionMatch[1].trim();
            if (optionText && 
                optionText !== 'Select one...' && 
                optionText !== 'Choose...' && 
                optionText !== 'Select...' &&
                optionText !== 'Select Country' &&
                optionText !== '') {
              options.push(optionText);
            }
          }
        }
      }
      
      if (options.length > 0) {
        element.options = options;
      }
    }

    // Also check for select elements inside divs with IDs (wrapper pattern)
    if (tagName === 'div') {
      // Look for select elements inside this div
      const divStart = html.indexOf(fullTag);
      if (divStart !== -1) {
        // Find the closing div tag
        const divEnd = html.indexOf('</div>', divStart);
        if (divEnd !== -1) {
          const divContent = html.substring(divStart, divEnd + 6);
          const selectRegex = /<select\b[^>]*>([\s\S]*?)<\/select>/gi;
          let selectMatch;

          while ((selectMatch = selectRegex.exec(divContent)) !== null) {
            const selectTag = selectMatch[0];
            const selectContent = selectMatch[1];
            
            // Extract options from this select
            const options: string[] = [];
            const optionRegex = /<option\b[^>]*>([^<]+)<\/option>/gi;
            let optionMatch;

            while ((optionMatch = optionRegex.exec(selectContent)) !== null) {
              const optionText = optionMatch[1].trim();
              if (optionText && 
                  optionText !== 'Select one...' && 
                  optionText !== 'Choose...' && 
                  optionText !== 'Select...' &&
                  optionText !== 'Select Country' &&
                  optionText !== '') {
                options.push(optionText);
              }
            }
            
            if (options.length > 0) {
              // Add this select as a separate element
              elements.push({
                id: `${elementId}-select`,
                tagName: 'select',
                options: options,
                text: selectTag.trim().substring(0, 100),
                formId: element.formId
              });
              console.log(`[Scan All Elements] Found select with options inside div ${elementId}:`, options);
            }
          }
        }
      }
    }

    // For input elements, get type
    if (tagName === 'input') {
      const typeMatch = fullTag.match(/type=(["']?)([^"'\s>]+)\1/);
      if (typeMatch) {
        element.type = typeMatch[2];
      }
    }

    // Try to find parent form
    const formMatch = html.match(new RegExp(`<form[^>]*>([\\s\\S]*?)<${tagName}[^>]*id=["']?${elementId}["']?[^>]*>`, 'i'));
    if (formMatch) {
      const formIdMatch = formMatch[0].match(/id=(["']?)([^"'\s>]+)\1/);
      const formNameMatch = formMatch[0].match(/name=(["']?)([^"'\s>]+)\1/);
      element.formId = formIdMatch ? formIdMatch[2] : formNameMatch ? formNameMatch[2] : undefined;
    }

    elements.push(element);
  }

  return elements;
}
