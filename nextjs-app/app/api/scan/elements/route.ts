import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, siteId } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`Scanning elements for URL: ${url}, siteId: ${siteId}`);

    // Use Puppeteer or similar to scan the page
    // For now, let's use a simple fetch approach and parse the HTML
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Parse HTML to find elements with IDs
      const elementsWithIds = extractElementsWithIds(html);
      
      console.log(`Found ${elementsWithIds.length} elements with IDs:`, elementsWithIds);
      
      return NextResponse.json({
        success: true,
        url,
        siteId,
        elementsCount: elementsWithIds.length,
        elements: elementsWithIds,
        scannedAt: new Date().toISOString()
      });
      
    } catch (fetchError) {
      console.error("Failed to fetch URL:", fetchError);
      return NextResponse.json({ 
        error: "Failed to fetch URL for scanning", 
        details: String(fetchError) 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error scanning elements:", error);
    return NextResponse.json(
      { error: "Failed to scan elements", details: String(error) }, 
      { status: 500 }
    );
  }
}

function extractElementsWithIds(html: string) {
  const elements: any[] = [];
  
  // Only find elements inside form containers
  const formElements = extractFormStructure(html);
  elements.push(...formElements);
  

  return elements;
}

function extractFormStructure(html: string) {
  const elements: any[] = [];
  
  // First, find the main form container
  const formRegex = /<form[^>]*>(.*?)<\/form>/gis;
  let formMatch;
  
  while ((formMatch = formRegex.exec(html)) !== null) {
    const formContent = formMatch[1];
    const fullFormTag = formMatch[0];
    
    // Extract form ID and name if available
    const formIdMatch = fullFormTag.match(/id\s*=\s*["']([^"']+)["']/i);
    const formNameMatch = fullFormTag.match(/name\s*=\s*["']([^"']+)["']/i);
    const formId = formIdMatch ? formIdMatch[1] : 'form';
    const formName = formNameMatch ? formNameMatch[1] : 'Form';
    
    console.log(`Processing form: ${formName} (${formId})`);
    
    // Extract all elements within this form (pass form context)
    const formElements = extractElementsFromContent(formContent, formId, formName);
    elements.push(...formElements);

    // Find all divs with IDs within the form (like your example)
    const divWithIdRegex = /<div[^>]*\s+id\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/div>/gis;
    let divMatch;

    while ((divMatch = divWithIdRegex.exec(formContent)) !== null) {
      const divId = divMatch[1];
      const divContent = divMatch[2];
      const fullDivTag = divMatch[0];

      // Get div text content (for labels)
      const divTextMatch = divContent.match(/^([^<]+)/);
      const divText = divTextMatch ? divTextMatch[1].trim() : '';

      const classMatch = fullDivTag.match(/class\s*=\s*["']([^"']*)["']/i);
      const className = classMatch ? classMatch[1] : '';

      // Check if this div contains form elements
      const hasFormElements = /<(input|select|textarea|label|button)[^>]*>/i.test(divContent);

      if (hasFormElements) {
        // Add the div wrapper
        elements.push({
          id: divId,
          name: divId,
          type: 'form-wrapper',
          tagName: 'div',
          className: className,
          isFormField: false,
          selector: `#${divId}`,
          fullTag: fullDivTag,
          isFormWrapper: true,
          label: divText || divId,
          formId: formId,
          formName: formName
        });

        // Extract elements from within this div (pass form context)
        const divElements = extractElementsFromContent(divContent, formId, formName);
        elements.push(...divElements);
      } else {
        // Even if it doesn't contain form elements, add it as a potential show/hide target
        elements.push({
          id: divId,
          name: divId,
          type: 'div',
          tagName: 'div',
          className: className,
          isFormField: false,
          selector: `#${divId}`,
          fullTag: fullDivTag,
          label: divText || divId,
          formId: formId,
          formName: formName
        });
      }
    }
  }
  
  // Remove duplicates based on ID
  const uniqueElements = [];
  const seenIds = new Set();
  for (const element of elements) {
    if (!seenIds.has(element.id)) {
      seenIds.add(element.id);
      uniqueElements.push(element);
    }
  }
  
  console.log(`Form structure extraction found ${uniqueElements.length} elements`);
  return uniqueElements;
}

function extractElementsFromContent(content: string, formId?: string, formName?: string) {
  const elements: any[] = [];

  // Find all elements with IDs in the content
  const idRegex = /<(\w+)[^>]*\s+id\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = idRegex.exec(content)) !== null) {
    const tagName = match[1].toLowerCase();
    const id = match[2].trim();
    const fullTag = match[0];

    if (id && id.length > 0) {
      const classMatch = fullTag.match(/class\s*=\s*["']([^"']*)["']/i);
      const className = classMatch ? classMatch[1] : '';

      const isFormField = ['input', 'select', 'textarea', 'button', 'form', 'label'].includes(tagName);

      let elementName = id;
      let displayName = id;
      let fieldName = null;
      let fieldType = null;
      
      // If it's a div, check if it contains a form element and extract the field name
      if (tagName === 'div') {
        // Find the closing div tag to get the full div content
        const divStartPos = match.index;
        const divCloseRegex = new RegExp(`<div[^>]*\\s+id\\s*=\\s*["']${id}["'][^>]*>([\\s\\S]*?)<\\/div>`, 'i');
        const divMatch = content.slice(divStartPos).match(divCloseRegex);
        
        if (divMatch) {
          const divContent = divMatch[1];
          
          // Check for input field
          const inputMatch = divContent.match(/<input[^>]*name\s*=\s*["']([^"']*)["'][^>]*>/i);
          if (inputMatch) {
            fieldName = inputMatch[1];
            const inputTypeMatch = divContent.match(/<input[^>]*type\s*=\s*["']([^"']*)["'][^>]*>/i);
            fieldType = inputTypeMatch ? inputTypeMatch[1] : 'text';
            const inputDataNameMatch = divContent.match(/<input[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
            displayName = inputDataNameMatch ? inputDataNameMatch[1] : fieldName;
            elementName = displayName;
          }
          
          // Check for select field
          if (!fieldName) {
            const selectMatch = divContent.match(/<select[^>]*name\s*=\s*["']([^"']*)["'][^>]*>/i);
            if (selectMatch) {
              fieldName = selectMatch[1];
              fieldType = 'select';
              const selectDataNameMatch = divContent.match(/<select[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
              displayName = selectDataNameMatch ? selectDataNameMatch[1] : fieldName;
              elementName = displayName;
            }
          }
          
          // Check for textarea field
          if (!fieldName) {
            const textareaMatch = divContent.match(/<textarea[^>]*name\s*=\s*["']([^"']*)["'][^>]*>/i);
            if (textareaMatch) {
              fieldName = textareaMatch[1];
              fieldType = 'textarea';
              const textareaDataNameMatch = divContent.match(/<textarea[^>]*data-name\s*=\s*["']([^"']*)["'][^>]*>/i);
              displayName = textareaDataNameMatch ? textareaDataNameMatch[1] : fieldName;
              elementName = displayName;
            }
          }
        }
      }

      const element: any = {
        id: id,
        name: elementName,
        displayName: displayName,
        fieldName: fieldName, // Actual form field name attribute
        type: fieldType || tagName,
        tagName: tagName,
        className: className,
        isFormField: isFormField || !!fieldName,
        selector: `#${id}`,
        fullTag: fullTag,
        formId: formId,
        formName: formName
      };

      // Special handling for select elements to extract options
      if (tagName === 'select' || fieldType === 'select') {
        element.options = extractSelectOptions(content, id);
        console.log(`Select element ${id} options:`, element.options);
      }

      // Special handling for input elements to get type and value
      if (tagName === 'input') {
        const typeMatch = fullTag.match(/type\s*=\s*["']([^"']*)["']/i);
        const valueMatch = fullTag.match(/value\s*=\s*["']([^"']*)["']/i);
        element.inputType = typeMatch ? typeMatch[1] : 'text';
        element.value = valueMatch ? valueMatch[1] : '';
        element.type = element.inputType; // Set type to inputType for consistency

        // Add options for radio/checkbox inputs as string array
        if (['radio', 'checkbox'].includes(element.inputType)) {
          element.options = [element.value || 'on'];
        }
      }

      elements.push(element);
    }
  }

  return elements;
}

function extractSelectOptions(content: string, selectId: string) {
  const options: string[] = [];
  
  // Find the select element and its content
  const selectRegex = new RegExp(`<select[^>]*id\\s*=\\s*["']${selectId}["'][^>]*>(.*?)</select>`, 'gis');
  const selectMatch = content.match(selectRegex);
  
  if (selectMatch) {
    const selectContent = selectMatch[1];
    
    // Extract option elements
    const optionRegex = /<option[^>]*>(.*?)<\/option>/gi;
    let optionMatch;
    
    while ((optionMatch = optionRegex.exec(selectContent)) !== null) {
      const optionText = optionMatch[1].trim();
      
      if (optionText && optionText !== '' && optionText !== 'Select one...') {
        // Return just the text (label) as the Rule Builder expects string arrays
        options.push(optionText);
      }
    }
  }
  
  console.log(`Extracted ${options.length} options for select#${selectId}:`, options);
  return options;
}
