import { NextResponse } from 'next/server';

// UPDATED: Dynamic ID matching for any form (v2)
export async function GET(req: Request) {
  try {
    console.log(`[Form Specific] 🚀 ===== REQUEST RECEIVED - VERSION 3.0 ===== `);
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Get the working Webflow forms data
    const webflowResponse = await fetch(`${req.url.split('/api')[0]}/api/webflow/site/${siteId}/forms`);
    if (!webflowResponse.ok) {
      throw new Error(`Webflow API error: ${webflowResponse.status}`);
    }

    const webflowData = await webflowResponse.json();
    const webflowForms = webflowData.forms || [];

    console.log(`[Form Specific] ===== LATEST CODE VERSION 2.0 ===== Found ${webflowForms.length} forms from Webflow API`);
    
    // 🛠️ FIX: Calculate htmlId for forms with null/empty htmlId
    // Webflow converts " - " (space-dash-space) to "---" (triple dash) in IDs
    webflowForms.forEach((form: any) => {
      if (!form.htmlId) {
        const name = form.displayName || form.name || form.id;
        const calculatedHtmlId = `wf-form-${name.replace(/\s+-\s+/g, '---').replace(/\s+/g, '-')}`;
        console.log(`[Form Specific] ⚠️  Form "${form.displayName}" has null htmlId. Calculated: "${calculatedHtmlId}"`);
        form.htmlId = calculatedHtmlId;
      }
    });

    // ✅ NEW SITE SCANNER: Scan ALL pages in the site using the new simplified scanner
    let siteElements: any[] = [];
    
    console.log(`[Form Specific] 🌐 Starting full site scan...`);
      
      try {
        // Call the new simplified site scanner
        const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-scanner?siteId=${siteId}`);
        
        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          siteElements = scanData.elements || [];
          
          console.log(`[Form Specific] ✅ Site scan complete!`);
          console.log(`[Form Specific] 📊 Found ${siteElements.length} elements from ${scanData.pagesScanned} pages`);
          
          // Log forms found
          const formsFound = Array.from(new Set(siteElements.map((el: any) => el.formId).filter(Boolean)));
          console.log(`[Form Specific] 📋 Forms detected: ${formsFound.join(', ')}`);
          
          // Check for HBI specifically
          const hbiElements = siteElements.filter((el: any) => el.formId?.includes('HBI'));
          console.log(`[Form Specific] 🔎 HBI elements found: ${hbiElements.length}`);
          
        } else {
          const errorText = await scanResponse.text();
          console.error(`[Form Specific] ❌ Site scanner failed: ${scanResponse.status}`);
          console.error(`[Form Specific] Error: ${errorText}`);
        }
      } catch (error) {
        console.error(`[Form Specific] ❌ Site scanner error:`, error);
      }
    
    // Fallback: Single-page scan (if multi-page failed to find elements)
    if (siteElements.length === 0) {
      console.log(`[Form Specific] ⚠️  Multi-page scan returned 0 elements. Attempting single-page fallback...`);
      
      // Get site URL dynamically from Webflow API
      let siteUrl = url.searchParams.get('url'); // Allow manual override via query param
      
      if (!siteUrl) {
        try {
          const sitesResponse = await fetch(`${req.url.split('/api')[0]}/api/webflow/sites`);
          if (sitesResponse.ok) {
            const sitesData = await sitesResponse.json();
            const site = sitesData.sites?.find((s: any) => s.id === siteId);
            if (site?.shortName) {
              siteUrl = `https://${site.shortName}.webflow.io`;
              console.log(`[Form Specific] 🔍 Got site URL from API: ${siteUrl}`);
            }
          }
        } catch (error) {
          console.warn(`[Form Specific] ⚠️  Could not fetch site URL:`, error);
        }
      }
      
      if (!siteUrl) {
        console.error(`[Form Specific] ❌ Cannot perform fallback scan - no site URL available`);
        siteElements = []; // Ensure it's an empty array
      } else {
        console.log(`[Form Specific] 🚀 Using SINGLE-PAGE scanner`);
        console.log(`[Form Specific] 📍 Scanning URL: ${siteUrl}`);
      
      try {
        const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/fresh-html?url=${encodeURIComponent(siteUrl)}`);
        
        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          siteElements = scanData.elements || [];
          console.log(`[Form Specific] ✅ Fresh HTML scan found ${siteElements.length} elements`);
          
          // Log what we found
          const checkboxes = siteElements.filter(el => el.type === 'checkbox');
          console.log(`[Form Specific] 📋 Found ${checkboxes.length} checkboxes: ${checkboxes.map(cb => cb.id).join(', ')}`);
        } else {
          console.error(`[Form Specific] ❌ Fresh HTML scanner failed: ${scanResponse.status}`);
        }
      } catch (error) {
        console.error(`[Form Specific] ❌ Scanner error:`, error);
      }
      }
    }

    // ✅ MERGE WEBFLOW API FORMS + SCANNER-DETECTED FORMS
    // This ensures forms appear immediately after publishing, even if Webflow API hasn't synchronized
    const scannedFormIds = Array.from(new Set(siteElements.map((el: any) => el.formId).filter(Boolean)));
    console.log(`[Form Specific] 📋 Scanner found ${scannedFormIds.length} unique form(s):`, scannedFormIds);

    // Build a map of formId → displayName from scanned elements
    // The scanner now extracts data-name attribute which is the user-friendly name
    const formDisplayNames = new Map<string, string>();
    siteElements.forEach((el: any) => {
      if (el.formId && el.formName) {
        formDisplayNames.set(el.formId, el.formName); // formName now contains the displayName from data-name
      }
    });

    // Create a Map to merge both sources
    // KEY STRATEGY: Use the ACTUAL published htmlId from scanner as the source of truth
    const allFormsMap = new Map();
    
    // Step 1: PRIORITIZE scanner-detected forms (these are the published reality)
    scannedFormIds.forEach((formId: string) => {
      // Use the displayName from the scanner (extracted from data-name attribute)
      // This gives us the clean name without the "-2" suffix
      const displayName = formDisplayNames.get(formId) || formId
        .replace(/^wf-form-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      
      // Find matching Webflow API form by comparing display names
      const matchingApiForm = webflowForms.find((wf: any) => {
        const wfName = (wf.displayName || wf.name || '').trim();
        return wfName === displayName || wfName === displayName.replace(/-/g, ' ');
      });
      
      if (matchingApiForm) {
        // Merge: Use Webflow API metadata but scanner's htmlId (the published ID)
        const mergedForm = {
          ...matchingApiForm,
          htmlId: formId, // ← Use scanner's published ID
          displayName: displayName, // ← Use scanner's clean display name
          _source: 'merged' // Tag as merged
        };
        allFormsMap.set(formId, mergedForm);
        console.log(`[Form Specific] 🔗 Merged form: "${displayName}" - API metadata + scanner ID (${formId})`);
      } else {
        // Scanner-only form (not yet in Webflow API)
        const syntheticForm = {
          id: formId,
          htmlId: formId,
          displayName: displayName,
          name: displayName,
          slug: formId.replace(/^wf-form-/, ''),
          fields: {},
          _source: 'scanner'
        };
        allFormsMap.set(formId, syntheticForm);
        console.log(`[Form Specific] 🆕 Scanner-only form: "${displayName}" (${formId})`);
      }
    });

    // Step 2: Add any remaining Webflow API forms not found by scanner
    // (These are unpublished or deleted forms)
    webflowForms.forEach((form: any) => {
      const formDisplayName = (form.displayName || form.name || '').trim();
      
      // Check if this form was already added from scanner
      const alreadyAdded = Array.from(allFormsMap.values()).some((f: any) => 
        (f.displayName || '').trim() === formDisplayName
      );
      
      if (!alreadyAdded) {
        const formHtmlId = form.htmlId || `wf-form-${formDisplayName.replace(/\s+/g, '-')}`;
        const formSource = { ...form, htmlId: formHtmlId, _source: 'webflow_api_only' };
        allFormsMap.set(formHtmlId, formSource);
        console.log(`[Form Specific] 📋 API-only form (not published): "${formDisplayName}" (${formHtmlId})`);
      }
    });

    console.log(`[Form Specific] 📊 Total forms to process: ${allFormsMap.size} (${webflowForms.length} from API + ${scannedFormIds.length - webflowForms.length} from scanner)`);

    // Create form-specific mappings by analyzing the HTML structure
    const formSpecificForms = Array.from(allFormsMap.values()).map((form: any) => {
      const formId = form.id || form._id;
      const formName = form.displayName || form.name || form.slug || form.id;
      
      // Webflow form's HTML ID (like "wf-form-State-Form-2") - this is what the scanner sees
      // IMPORTANT: Use the same calculation as the earlier fix for null htmlId
      const formHtmlId = form.htmlId || `wf-form-${formName.replace(/\s+-\s+/g, '---').replace(/\s+/g, '-')}`;
      
      console.log(`[Form Specific] 🔍 Processing form: "${formName}" (htmlId: "${formHtmlId}")`);
      
      // 🔍 DEBUGGING: Special logging for example form
      if (formName.includes('Example') || formHtmlId.includes('Example')) {
        console.log(`[Form Specific] 🔎 EXAMPLE FORM DETECTED!`);
        console.log(`[Form Specific] 🔎 Example formId: ${formId}`);
        console.log(`[Form Specific] 🔎 Example formHtmlId: ${formHtmlId}`);
        console.log(`[Form Specific] 🔎 Example formName: ${formName}`);
        console.log(`[Form Specific] 🔎 Example source: ${form._source || 'unknown'}`);
        console.log(`[Form Specific] 🔎 Example form.fields:`, form.fields);
        console.log(`[Form Specific] 🔎 Example form.fields keys:`, Object.keys(form.fields || {}));
        console.log(`[Form Specific] 🔎 HBI siteElements count: ${siteElements.length}`);
        
        const exampleElements = siteElements.filter(el => 
          el.formId?.includes('Example') || el.formName?.includes('Example')
        );
        console.log(`[Form Specific] 🔎 Example elements found in siteElements (${exampleElements.length} total):`, exampleElements.map(el => ({
          id: el.id,
          name: el.name,
          type: el.type,
          formId: el.formId,
          formName: el.formName
        })));
      }
      
      // 🔧 TEMPORARY FIX: For example form, use explicit formId matching first
      let formElements: any[] = [];
      
      if (formName.includes('Example') || formHtmlId.includes('Example')) {
        console.log(`[Form Specific] 🔧 Using explicit HBI filter bypass`);
        // Direct filter: element.formId === formHtmlId
        formElements = siteElements.filter((element: any) => {
          const match = element.formId === formHtmlId;
          if (match) {
            console.log(`[Form Specific] ✅ HBI EXPLICIT MATCH: ${element.id}`);
          }
          return match;
        });
        console.log(`[Form Specific] 🔧 Example explicit filter found ${formElements.length} elements`);
      }
      
      // If no elements found with explicit match, or not HBI form, use normal filter
      if (formElements.length === 0) {
        formElements = siteElements.filter(element => {
        const elementName = (element.id || element.name || '').toLowerCase();
        const currentFormName = formName.toLowerCase();
        
        // 🔍 DEBUGGING: Log HBI element filter checks
        const isExampleElement = element.formId?.includes('Example') || element.formName?.includes('Example');
        const isExampleForm = formName.includes('Example') || formHtmlId.includes('Example');
        if (isExampleElement && isExampleForm) {
          console.log(`[Form Specific] 🔎 Example FILTER CHECK: element="${element.id}", elementFormId="${element.formId}", formHtmlId="${formHtmlId}"`);
        }
        
        // ✅ BEST: Direct formId match from HTML structure
        if (element.formId) {
          const elementFormId = element.formId;
          
          // Try to match the Webflow form's HTML ID
          // The scanner gives us the actual <form id="..."> value
          // Webflow forms typically use format: "wf-form-{FormName}"
          
          // Strategy 1: Match by normalized form name from formId
          const normalizeFormName = (name: string) => {
            return name.toLowerCase()
              .replace(/^wf-form-/, '') // Remove wf-form- prefix
              .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
              .trim();
          };
          
          const elementFormIdNorm = normalizeFormName(elementFormId);
          const currentFormNameNorm = normalizeFormName(formName);
          const formHtmlIdNorm = normalizeFormName(formHtmlId);
          
          // 🔍 DEBUGGING: Log exact comparison for HBI
          if (isHBIElement && isHBIForm) {
            console.log(`[Form Specific] 🔎 HBI COMPARISON:`);
            console.log(`[Form Specific] 🔎   elementFormId === formHtmlId? ${elementFormId === formHtmlId} ("${elementFormId}" vs "${formHtmlId}")`);
            console.log(`[Form Specific] 🔎   elementFormIdNorm === formHtmlIdNorm? ${elementFormIdNorm === formHtmlIdNorm} ("${elementFormIdNorm}" vs "${formHtmlIdNorm}")`);
            console.log(`[Form Specific] 🔎   Length check: elementFormId.length=${elementFormId?.length}, formHtmlId.length=${formHtmlId?.length}`);
          }
          
          // ✅ PRIORITY 1: Exact string match (most reliable)
          if (elementFormId && formHtmlId && elementFormId === formHtmlId) {
            console.log(`[Form Specific]   ✅ MATCHED by exact formId: ${element.id} → form "${formName}"`);
            return true;
          }
          
          // ✅ PRIORITY 2: Normalized match (handles case/spacing differences)
          if (elementFormIdNorm && formHtmlIdNorm && elementFormIdNorm === formHtmlIdNorm) {
            console.log(`[Form Specific]   ✅ MATCHED by normalized formId: ${element.id} → form "${formName}"`);
            return true;
          }
          
          // 🔍 DEBUGGING: Log why HBI elements don't match
          if (isExampleElement && isExampleForm) {
            console.log(`[Form Specific] 🔎 Example NO EXACT MATCH: elementFormId="${elementFormId}", formHtmlId="${formHtmlId}"`);
            console.log(`[Form Specific] 🔎 Example NORMALIZED: elementFormIdNorm="${elementFormIdNorm}", formHtmlIdNorm="${formHtmlIdNorm}"`);
          }
          
          // Match by normalized form name embedded in formId
          if (elementFormIdNorm && currentFormNameNorm && 
              (elementFormIdNorm.includes(currentFormNameNorm) || currentFormNameNorm.includes(elementFormIdNorm))) {
            console.log(`[Form Specific]   ✅ MATCHED by partial formId: ${element.id} → form "${formName}"`);
            return true;
          }
          
          // Element has formId but doesn't match this form - SKIP IT
          console.log(`[Form Specific]   ⏭️  Element ${element.id} belongs to different form: "${elementFormId}"`);
          return false;
        }
        
        // FALLBACK: If element has formName metadata from scanner
        if (element.formName) {
          const elementFormName = (element.formName || '').toLowerCase();
          
          const normalizeFormName = (name: string) => {
            return name.toLowerCase()
              .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
              .trim();
          };
          
          const elementFormNameNorm = normalizeFormName(elementFormName);
          const currentFormNameNorm = normalizeFormName(currentFormName);
          
          // Direct match by normalized form name
          if (elementFormNameNorm && currentFormNameNorm && elementFormNameNorm === currentFormNameNorm) {
            console.log(`[Form Specific]   ✅ MATCHED by formName: ${element.id} → form "${formName}"`);
            return true;
          }
          
          // Partial match
          if (elementFormNameNorm && currentFormNameNorm && 
              (elementFormNameNorm.includes(currentFormNameNorm) || currentFormNameNorm.includes(elementFormNameNorm))) {
            console.log(`[Form Specific]   ✅ MATCHED by partial formName: ${element.id} → form "${formName}"`);
            return true;
          }
        }
        
        // LAST RESORT: Keyword-based fuzzy matching for elements without form metadata
        // This should rarely be needed - most elements should have formId from HTML scan
        console.log(`[Form Specific]   ⚠️  Element ${element.id} has no formId/formName - using fuzzy keyword matching`);
        
        // Extract keywords from form name (split by space, dash, underscore)
        // and check if element name contains any of those keywords
        const formKeywords = currentFormName
          .split(/[\s-_]+/)
          .filter((word: string) => word.length > 2)
          .map((word: string) => word.toLowerCase());
        
        // Check if element name contains any form keyword
        const hasMatchingKeyword = formKeywords.some((keyword: string) => 
          elementName.includes(keyword)
        );
        
        if (hasMatchingKeyword) {
          console.log(`[Form Specific]   ✓ Fuzzy match: "${element.id}" contains keyword from "${formName}"`);
          return true;
        }
        
        // Don't include elements without clear association
        console.log(`[Form Specific]   ✗ No match: "${element.id}" doesn't match form "${formName}"`);
        return false;
        });
      }

      console.log(`[Form Specific] Form "${formName}" has ${formElements.length} relevant elements`);
      
      // 🔍 DEBUGGING: Extra logging for example form elements
      if (formName.includes('Example') || formHtmlId.includes('Example')) {
        console.log(`[Form Specific] 🔎 Example formElements count AFTER FILTER: ${formElements.length}`);
        console.log(`[Form Specific] 🔎 Example formElements IDs:`, formElements.map((el: any) => el.id));
        if (formElements.length === 0) {
          console.log(`[Form Specific] 🚨 HBI WARNING: No elements matched the filter! This is likely the problem.`);
          console.log(`[Form Specific] 🚨 Example formHtmlId was: "${formHtmlId}"`);
          console.log(`[Form Specific] 🚨 Example siteElements with Example formId:`, siteElements.filter((el: any) => 
            el.formId?.includes('HBI')
          ).map((el: any) => ({ id: el.id, formId: el.formId })));
        }
      }
      
      if (formElements.length > 0) {
        console.log(`[Form Specific] Elements for "${formName}":`, formElements.map(el => ({
          id: el.id,
          name: el.name || el.displayName,
          type: el.type || el.tagName,
          formId: el.formId,
          formName: el.formName
        })));
      }

      // Create fields with form-specific elements
      const formFields = Object.entries(form.fields || {}).map(([fieldId, fieldData]: [string, any]) => {
        // Try to find a matching scanned wrapper with better display name (label text)
        let enhancedDisplayName = fieldData.displayName || fieldData.name || fieldId;
        
        // Normalize strings for better matching
        const normalize = (str: string) => str.toLowerCase().replace(/[-_\s]/g, '');
        const fieldNameNorm = normalize(fieldData.name || fieldData.displayName || '');
        const fieldDisplayNameNorm = normalize(fieldData.displayName || fieldData.name || '');
        
        const matchingWrapper = formElements.find((el: any) => {
          if (!el.isFormWrapper) return false;
          
          // Get normalized versions of wrapper names
          const wrapperFieldNameNorm = normalize(el.fieldName || '');
          const wrapperNameNorm = normalize(el.name || '');
          const wrapperDisplayNameNorm = normalize(el.displayName || '');
          
          // Try multiple matching strategies:
          // 1. Exact match on field name attribute
          if (wrapperFieldNameNorm && (wrapperFieldNameNorm === fieldNameNorm || wrapperFieldNameNorm === fieldDisplayNameNorm)) {
            return true;
          }
          
          // 2. Match on any name variation
          if (wrapperNameNorm && (wrapperNameNorm === fieldNameNorm || wrapperNameNorm === fieldDisplayNameNorm)) {
            return true;
          }
          
          // 3. Match on display name
          if (wrapperDisplayNameNorm && (wrapperDisplayNameNorm === fieldNameNorm || wrapperDisplayNameNorm === fieldDisplayNameNorm)) {
            return true;
          }
          
          // 4. Partial match (contains) - useful for things like "name" matching "full-name"
          if (fieldNameNorm && wrapperFieldNameNorm && 
              (wrapperFieldNameNorm.includes(fieldNameNorm) || fieldNameNorm.includes(wrapperFieldNameNorm))) {
            return true;
          }
          
          return false;
        });
        
        let actualFieldName = fieldData.name || fieldData.displayName || fieldId;
        
        if (matchingWrapper) {
          if (matchingWrapper.displayName) {
            enhancedDisplayName = matchingWrapper.displayName;
            console.log(`[Form Specific] Enhanced field "${fieldData.name || fieldData.displayName}" with wrapper label "${matchingWrapper.displayName}"`);
          }
          // Use the wrapper's fieldName (actual form input name attribute) if available
          if (matchingWrapper.fieldName) {
            actualFieldName = matchingWrapper.fieldName;
            console.log(`[Form Specific] Using wrapper fieldName "${matchingWrapper.fieldName}" for field "${fieldData.name}"`);
          }
        }
        
        // Normalize Webflow field types to standard HTML types
        let fieldType = (fieldData.type || '').toString().toLowerCase();
        if (fieldType === 'plain') {
          fieldType = 'text'; // Webflow uses "Plain" for text inputs, but we need "text"
        }
        
        // DYNAMIC: Search for matching HTML element ID - works for ANY form!
        let htmlElementId = fieldData._id;
        
        // Helper function to detect if an ID is a MongoDB ObjectID (24 hex chars)
        const isMongoId = (id: string) => /^[0-9a-f]{24}$/i.test(id);
        
        // If the current elementId is a MongoDB ID, we need to find the real HTML ID
        if (isMongoId(htmlElementId)) {
          htmlElementId = undefined;
        }
        
        // Search BOTH formElements (already filtered) AND siteElements (all scanned elements)
        const searchArrays = [formElements, siteElements];
        let matchingElement = null;
        
        for (const searchArray of searchArrays) {
          matchingElement = searchArray.find((el: any) => {
            const elementIdNorm = normalize(el.id || '');
            const elementNameNorm = normalize(el.name || '');
            const elementDataName = normalize(el['data-name'] || '');
            
            // Helper: Remove numeric suffixes for better matching
            // e.g., "fullname2" → "fullname", "selectcountry2" → "selectcountry"
            const removeNumericSuffix = (str: string) => str.replace(/\d+$/, '');
            
            const elementIdBase = removeNumericSuffix(elementIdNorm);
            const elementNameBase = removeNumericSuffix(elementNameNorm);
            const elementDataNameBase = removeNumericSuffix(elementDataName);
            const fieldDisplayNameBase = removeNumericSuffix(fieldDisplayNameNorm);
            const fieldNameBase = removeNumericSuffix(fieldNameNorm);
            
            // Enhanced matching with data-name attribute and fuzzy matching
            const isMatch = (
              // Exact matches
              (fieldDisplayNameNorm && elementIdNorm === fieldDisplayNameNorm) ||
              (fieldDisplayNameNorm && elementNameNorm === fieldDisplayNameNorm) ||
              (fieldDisplayNameNorm && elementDataName === fieldDisplayNameNorm) ||
              (fieldNameNorm && elementIdNorm === fieldNameNorm) ||
              (fieldNameNorm && elementNameNorm === fieldNameNorm) ||
              (fieldNameNorm && elementDataName === fieldNameNorm) ||
              // Matches without numeric suffix (e.g., "Full Name" → "Full-Name-2")
              (fieldDisplayNameBase && elementIdBase && fieldDisplayNameBase === elementIdBase) ||
              (fieldDisplayNameBase && elementNameBase && fieldDisplayNameBase === elementNameBase) ||
              (fieldDisplayNameBase && elementDataNameBase && fieldDisplayNameBase === elementDataNameBase) ||
              (fieldNameBase && elementIdBase && fieldNameBase === elementIdBase) ||
              (fieldNameBase && elementNameBase && fieldNameBase === elementNameBase) ||
              (fieldNameBase && elementDataNameBase && fieldNameBase === elementDataNameBase) ||
              // Fuzzy matching: check if field name is contained in element ID/name
              (fieldDisplayNameNorm && elementIdNorm.includes(fieldDisplayNameNorm)) ||
              (fieldDisplayNameNorm && elementNameNorm.includes(fieldDisplayNameNorm)) ||
              (fieldNameNorm && elementIdNorm.includes(fieldNameNorm)) ||
              (fieldNameNorm && elementNameNorm.includes(fieldNameNorm))
            );
            
            if (isMatch) {
              console.log(`[Form Specific] 🎯 MATCH FOUND: "${fieldData.displayName || fieldData.name}" → Element ID: "${el.id}", Name: "${el.name}", Data-name: "${el['data-name']}"`);
            }
            
            return isMatch;
          });
          
          if (matchingElement) break; // Found a match, stop searching
        }
        
        // If no match found, try to use the field's own ID if it looks like an HTML ID
        if (!matchingElement && !isMongoId(fieldId)) {
          htmlElementId = fieldId;
          console.log(`[Form Specific] ✓ FALLBACK: Using field ID "${fieldId}" as HTML element ID`);
        } else if (matchingElement && matchingElement.id) {
          htmlElementId = matchingElement.id;
          console.log(`[Form Specific] ✓ DYNAMIC MATCH: "${fieldData.displayName || fieldData.name}" → ID: "${htmlElementId}"`);
        } else if (!htmlElementId) {
          console.log(`[Form Specific] ✗ NO MATCH: "${fieldData.displayName || fieldData.name}" - script may fail`);
        }
        
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: fieldType,
          displayName: enhancedDisplayName, // Use enhanced display name from label if available
          elementId: htmlElementId || fieldData.name || fieldData.displayName || '', // Never fall back to MongoDB ObjectID
          fieldName: actualFieldName || fieldData.name || fieldData.displayName || '', // Never fall back to MongoDB ObjectID
          options: matchingElement?.options || undefined // DYNAMIC: Get options from matched element if available
        };

        // For select and radio fields, try to find matching options if we don't have them yet
        if ((fieldData.type === 'Select' || fieldData.type === 'Radio') && !field.options) {
          let foundOptions = null;
          
          // Try to find in site elements (the fresh HTML scanner already provides options)
          if (true) { // Using fresh HTML scanner - options come from siteElements
            const matchingElement = siteElements.find(el => {
              if (el.tagName !== 'select') return false;
              
              const elementId = (el.id || '').toLowerCase();
              const elementName = (el.name || '').toLowerCase();
              const fieldDisplayName = (fieldData.displayName || '').toLowerCase();
              const fieldName = (field.name || '').toLowerCase();
              const fieldDataName = (fieldData.name || '').toLowerCase();
              
              // Normalize names for better matching
              const normalizeName = (name: string) => name.replace(/[-_\s]/g, '').toLowerCase();
              
              return (
                // Exact ID matches
                el.id === fieldId || 
                el.id === fieldData._id ||
                // Exact name matches
                el.name === field.name ||
                el.name === fieldData.displayName ||
                el.name === fieldData.name ||
                // Normalized matches
                normalizeName(elementId) === normalizeName(fieldDisplayName) ||
                normalizeName(elementId) === normalizeName(fieldName) ||
                normalizeName(elementId) === normalizeName(fieldDataName) ||
                normalizeName(elementName) === normalizeName(fieldDisplayName) ||
                normalizeName(elementName) === normalizeName(fieldName) ||
                normalizeName(elementName) === normalizeName(fieldDataName) ||
                // Partial matches
                (fieldDisplayName && (elementId.includes(fieldDisplayName) || elementName.includes(fieldDisplayName))) ||
                (fieldName && (elementId.includes(fieldName) || elementName.includes(fieldName))) ||
                (fieldDataName && (elementId.includes(fieldDataName) || elementName.includes(fieldDataName))) ||
                // Reverse partial matches
                (fieldDisplayName && (fieldDisplayName.includes(elementId) || fieldDisplayName.includes(elementName))) ||
                (fieldName && (fieldName.includes(elementId) || fieldName.includes(elementName))) ||
                (fieldDataName && (fieldDataName.includes(elementId) || fieldDataName.includes(elementName)))
              );
            });
            
            if (matchingElement && matchingElement.options && matchingElement.options.length > 0) {
              foundOptions = matchingElement.options;
              console.log(`[Form Specific] Found options from site elements for ${field.name}:`, foundOptions.slice(0, 3));
            }
          }
          
          // Set the options
          if (foundOptions && foundOptions.length > 0) {
            field.options = foundOptions;
          } else {
            field.options = [];
            console.log(`[Form Specific] No options found for ${field.name} in form "${formName}"`);
          }
        }

        return field;
      });

      // Add form-specific elements as show/hide targets
      // IMPORTANT: Only add elements that actually belong to THIS form
      console.log(`[Form Specific] 🔍 Checking ${formElements.length} scanned elements for "${formName}"`);
      
      formElements.forEach(element => {
        const isFormField = formFields.some(field => field.elementId === element.id);
        
        console.log(`[Form Specific] Examining element: ${element.id} (type: ${element.type}, already in fields: ${isFormField})`);
        
        // Double-check: If element has formName metadata, verify it matches THIS form
        if (element.formName) {
          const normalizeFormName = (name: string) => {
            return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          };
          
          const elementFormNameNorm = normalizeFormName(element.formName || '');
          const currentFormNameNorm = normalizeFormName(formName);
          
          // Skip if element clearly belongs to a different form
          if (elementFormNameNorm && currentFormNameNorm && 
              elementFormNameNorm !== currentFormNameNorm && 
              !elementFormNameNorm.includes(currentFormNameNorm) && 
              !currentFormNameNorm.includes(elementFormNameNorm)) {
            console.log(`[Form Specific] ⏭️  Skipping element ${element.id} - belongs to "${element.formName}", not "${formName}"`);
            return; // Skip this element
          }
        }
        
        if (!isFormField) {
          // Only add elements that are actual form inputs or valid show/hide targets
          // Filter out wrapper divs and non-input elements
          const validTypes = ['input', 'checkbox', 'radio', 'select', 'textarea', 'button', 'text', 'email', 'number', 'tel', 'url', 'date', 'time'];
          const elementType = (element.type || element.tagName || '').toLowerCase();
          
          // Skip generic divs/containers unless they have a valid form-related name
          if (elementType === 'div' || elementType === 'section' || elementType === 'container') {
            console.log(`[Form Specific] ⏭️  Skipping wrapper element: ${element.id} (type: ${elementType})`);
            return;
          }
          
          // Only add if it's a valid input type
          if (validTypes.includes(elementType) || element.formId || element.isShowHideTarget) {
            console.log(`[Form Specific] ✅ ADDING scanned element: ${element.id} (${element.name}) type: ${elementType}`);
            formFields.push({
              id: element.id,
              name: element.displayName || element.name || element.id,
              type: element.type || element.tagName,
              displayName: element.displayName || element.name || element.id,
              elementId: element.id,
              isShowHideTarget: true,
              formId: formId,
              fieldName: element.fieldName
            } as any);
          } else {
            console.log(`[Form Specific] ⏭️  Skipping non-input element: ${element.id} (type: ${elementType})`);
          }
        }
      });

      console.log(`[Form Specific] Final fields for "${formName}":`, formFields.map(f => ({
        name: f.displayName || f.name,
        type: f.type,
        id: f.id,
        elementId: f.elementId,
        fieldName: f.fieldName // Show the actual field name for debugging
      })));

      // ✅ AUTOMATIC FILTERING: Remove fields without valid elementId and non-input elements
      // These are stale entries from Webflow API that don't exist in published HTML
      const beforeCount = formFields.length;
      const validFields = formFields.filter(field => {
        // Filter out fields with no elementId
        if (!field.elementId || field.elementId === 'undefined') {
          console.log(`[Form Specific] 🗑️  FILTERED OUT: "${field.name}" - no elementId (element was deleted or not published)`);
          return false;
        }
        
        // Filter out submit buttons, reset buttons, and other non-input field types
        if (field.type === 'submit' || field.type === 'reset' || field.type === 'button' || field.type === 'image') {
          console.log(`[Form Specific] 🗑️  FILTERED OUT: "${field.name}" - non-input type (${field.type})`);
          return false;
        }
        
        return true;
      });
      
      const filteredCount = beforeCount - validFields.length;
      if (filteredCount > 0) {
        console.log(`[Form Specific] ✂️  Filtered ${beforeCount} → ${validFields.length} fields (removed ${filteredCount} stale entries)`);
      }

      // 🔍 DEDUPLICATION: Remove duplicate entries (same elementId)
      const seenIds = new Set<string>();
      const dedupedFields = validFields.filter(field => {
        if (seenIds.has(field.elementId)) {
          console.log(`[Form Specific] 🗑️  DEDUPLICATED: "${field.name}" (duplicate elementId: ${field.elementId})`);
          return false;
        }
        seenIds.add(field.elementId);
        return true;
      });
      
      const dupCount = validFields.length - dedupedFields.length;
      if (dupCount > 0) {
        console.log(`[Form Specific] ✂️  Deduplicated ${validFields.length} → ${dedupedFields.length} fields (removed ${dupCount} duplicates)`);
      }

      return {
        id: formId,
        name: formName,
        fields: dedupedFields // Return only valid, deduplicated fields
      };
    }).filter(form => {
      // Only return forms that have at least 1 valid field
      if (form.fields.length === 0) {
        console.log(`[Form Specific] 🗑️  FILTERED OUT FORM: "${form.name}" - no valid fields (all elements were deleted or not published)`);
        return false;
      }
      
      // Filter out forms that only have 1 field (likely broken/incomplete forms)
      if (form.fields.length === 1) {
        console.log(`[Form Specific] 🗑️  FILTERED OUT FORM: "${form.name}" - only 1 field (likely broken/incomplete form)`);
        return false;
      }
      
      console.log(`[Form Specific] ✅ KEEPING FORM: "${form.name}" - has ${form.fields.length} valid field(s)`);
      return true;
    });

    console.log(`[Form Specific] Returning ${formSpecificForms.length} forms with valid elements (filtered out forms with 0 fields)`);
    console.log(`[Form Specific] Final forms:`, formSpecificForms.map(f => ({ name: f.name, fieldCount: f.fields.length })));

    return NextResponse.json({
      forms: formSpecificForms,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Form Specific] Error:', error);
    return NextResponse.json(
      { error: `Failed to get form-specific data: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
