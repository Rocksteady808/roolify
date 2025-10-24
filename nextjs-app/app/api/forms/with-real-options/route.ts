import { NextResponse } from 'next/server';
import { getTokenForSite } from '../../../../lib/webflowStore';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    console.log(`[Forms with Real Options] 🔍 DEBUG: Starting request for siteId: ${siteId}`);
    
    if (!siteId) {
      console.log(`[Forms with Real Options] ❌ DEBUG: No siteId provided`);
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const tokenRecord = await getTokenForSite(siteId);
    console.log(`[Forms with Real Options] 🔍 DEBUG: Token record found:`, tokenRecord ? 'YES' : 'NO');
    console.log(`[Forms with Real Options] 🔍 DEBUG: Token record details:`, tokenRecord ? {
      hasToken: !!tokenRecord.token,
      hasSite: !!tokenRecord.site,
      siteShortName: tokenRecord.site?.shortName
    } : 'NONE');
    
    if (!tokenRecord) {
      console.log(`[Forms with Real Options] ❌ DEBUG: No token found for site ${siteId}`);
      return NextResponse.json({ error: "No token found for site" }, { status: 401 });
    }
    
    const token = tokenRecord.token;

    // Get forms from Webflow API
    const formsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/forms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });

    if (!formsResponse.ok) {
      throw new Error(`Webflow API error: ${formsResponse.status}`);
    }

    const formsData = await formsResponse.json();
    const forms = formsData.forms || [];

    console.log(`[Forms with Real Options] Found ${forms.length} forms from Webflow API`);

    // Fetch pages to get publish status
    const pagesResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/pages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });

    let publishedPageIds = new Set<string>();
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      const pages = pagesData.pages || [];
      
      pages.forEach((page: any) => {
        // Only include published, non-archived pages
        // Exclude: draft pages (draft: true) and archived pages (archived: true)
        // NOTE: Webflow uses "draft" not "isDraft"
        if (!page.archived && !page.draft) {
          publishedPageIds.add(page.id);
        }
      });
      
      console.log(`[Forms with Real Options] Page status: ${publishedPageIds.size} published pages`);
    }

    // Initialize selectOptions array first
    let selectOptions: any[] = [];

    // Combine Webflow forms with real select options (first without options)
    const formsWithOptions = forms.map((form: any) => {
      const fieldsWithOptions = Object.entries(form.fields || {}).map(([fieldId, fieldData]: [string, any]) => {
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: (fieldData.type || '').toString().toLowerCase(),
          displayName: fieldData.displayName || fieldData.name || fieldId,
          elementId: fieldData._id || undefined,
          options: undefined
        };

        // If it's a select field, try to find matching options from the scan
        console.log(`[Forms with Real Options] Field "${field.name}" type: "${field.type}" (original: "${fieldData.type}")`);
        if (field.type === 'select' || fieldData.type === 'Select') {
          const matchingSelect = selectOptions.find((select: any) => 
            select.id === fieldId || 
            select.name === field.name ||
            select.id === fieldData._id
          );
          
          if (matchingSelect && matchingSelect.options) {
            field.options = matchingSelect.options;
            console.log(`[Forms with Real Options] Found scanned options for ${field.name}:`, matchingSelect.options);
          } else if (fieldData.options && Array.isArray(fieldData.options)) {
            // Fallback to Webflow field options if scanning failed
            field.options = fieldData.options.map((option: any) => 
              typeof option === 'string' ? option : (option.label || option.value || option.name || option)
            );
            console.log(`[Forms with Real Options] Using Webflow options for ${field.name}:`, field.options);
          } else {
            console.log(`[Forms with Real Options] No options found for ${field.name}`);
            field.options = [];
          }
        }

        return field;
      });

      return {
        id: form.id || form._id,
        name: form.displayName || form.name || form.slug || form.id,
        displayName: form.displayName,
        pageName: form.pageName,
        pageId: form.pageId,
        siteId: form.siteId,
        fields: fieldsWithOptions
      };
    });

    // Skip site scanning entirely - get options directly from Webflow field data
    console.log(`[Forms with Real Options] Getting options directly from Webflow field data...`);
    
    // Update forms with Webflow field options
    formsWithOptions.forEach((form: any) => {
      form.fields.forEach((field: any) => {
        if (field.type === 'select') {
          // Get options from the original Webflow form data
          const originalForm = forms.find(f => f.id === form.id);
          console.log(`[Forms with Real Options] Processing field "${field.name}" (type: ${field.type})`);
          console.log(`[Forms with Real Options] Original form fields:`, Object.keys(originalForm?.fields || {}));
          
          if (originalForm && originalForm.fields) {
            const originalField = Object.values(originalForm.fields).find((f: any) => 
              f._id === field.elementId || f.displayName === field.name
            );
            
            console.log(`[Forms with Real Options] Found original field:`, {
              id: originalField?._id,
              name: originalField?.displayName,
              type: originalField?.type,
              hasOptions: !!originalField?.options,
              optionsLength: originalField?.options?.length || 0,
              options: originalField?.options,
              allKeys: Object.keys(originalField || {})
            });
            
            // Try multiple ways to get options
            let options = [];
            
            // Method 1: Direct options array
            if (originalField?.options && Array.isArray(originalField.options)) {
              options = originalField.options.map((option: any) => 
                typeof option === 'string' ? option : (option.label || option.value || option.name || option)
              );
              console.log(`[Forms with Real Options] ✅ Method 1 - Found direct options for ${field.name}:`, options);
            }
            
            // Method 2: Check for choices array
            else if (originalField?.choices && Array.isArray(originalField.choices)) {
              options = originalField.choices.map((choice: any) => 
                typeof choice === 'string' ? choice : (choice.label || choice.value || choice.name || choice)
              );
              console.log(`[Forms with Real Options] ✅ Method 2 - Found choices for ${field.name}:`, options);
            }
            
            // Method 3: Check for values array
            else if (originalField?.values && Array.isArray(originalField.values)) {
              options = originalField.values.map((value: any) => 
                typeof value === 'string' ? value : (value.label || value.value || value.name || value)
              );
              console.log(`[Forms with Real Options] ✅ Method 3 - Found values for ${field.name}:`, options);
            }
            
            // Method 4: Check for items array
            else if (originalField?.items && Array.isArray(originalField.items)) {
              options = originalField.items.map((item: any) => 
                typeof item === 'string' ? item : (item.label || item.value || item.name || item)
              );
              console.log(`[Forms with Real Options] ✅ Method 4 - Found items for ${field.name}:`, options);
            }
            
            if (options.length > 0) {
              field.options = options;
              console.log(`[Forms with Real Options] ✅ Final options for ${field.name}:`, field.options);
            } else {
              console.log(`[Forms with Real Options] ❌ No options found in any method for ${field.name}`);
              field.options = [];
            }
          } else {
            console.log(`[Forms with Real Options] ❌ No original form found for field ${field.name}`);
            field.options = [];
          }
        }
      });
    });

    // Enable site scanning to get real options
    if (true) {
      
      // Update forms with scanned select options
      formsWithOptions.forEach((form: any) => {
        form.fields.forEach((field: any) => {
          if (field.type === 'select') {
            // Normalize field name for matching (spaces to hyphens)
            const normalizedFieldName = field.name.replace(/\s+/g, '-');
            
            const matchingSelect = selectOptions.find((select: any) => {
              // Normalize select name for comparison
              const normalizedSelectName = select.name.replace(/\s+/g, '-');
              
              return (
                select.id === field.id || 
                select.name === field.name ||
                normalizedSelectName === normalizedFieldName ||
                select.id === normalizedFieldName ||
                select.id === field.elementId
              );
            });
            
            if (matchingSelect && matchingSelect.options) {
              field.options = matchingSelect.options;
              console.log(`[Forms with Real Options] ✅ Matched options for "${field.name}":`, matchingSelect.options.slice(0, 3), `... (${matchingSelect.options.length} total)`);
            } else {
              console.log(`[Forms with Real Options] ❌ No options found for select field "${field.name}" (normalized: "${normalizedFieldName}")`);
            }
          }
        });
      });
    }

    // Apply filtering - exclude forms from Utility Pages folder AND unpublished pages
    const filteredForms = formsWithOptions.filter((form: any) => {
      const pageName = form.pageName || '';
      const pageId = form.pageId || '';
      
      // Filter out forms from Utility Pages folder
      if (pageName.includes('Utility Pages')) {
        console.log(`[Forms with Real Options] ❌ FILTERED: Utility Pages folder - "${form.displayName}" on "${pageName}"`);
        return false;
      }
      
      // Filter out forms from specific utility/template pages by name
      const utilityPageNames = ['Style Guide', 'Password', '404', 'Utility'];
      
      // Check multiple possible fields where page name might be stored
      const pageNameFields = [
        pageName,
        form.pageName,
        form.page?.name,
        form.page?.title,
        form.page?.slug
      ].filter(Boolean); // Remove null/undefined values
      
      if (utilityPageNames.some(utilityName => 
        pageNameFields.some(field => 
          field.toLowerCase().includes(utilityName.toLowerCase())
        )
      )) {
        console.log(`[Forms with Real Options] ❌ FILTERED: Utility page by name - "${form.displayName}" on "${pageName}"`);
        return false;
      }
      
      // Filter out forms from archived/unpublished pages
      if (pageId && publishedPageIds.size > 0 && !publishedPageIds.has(pageId)) {
        console.log(`[Forms with Real Options] ❌ FILTERED: Unpublished/archived page - "${form.displayName}" on "${pageName}" (pageId: ${pageId})`);
        return false;
      }
      
      console.log(`[Forms with Real Options] ✅ KEEPING: "${form.displayName}" on "${pageName}"`);
      return true;
    });

    // Deduplicate forms by ID and name
    const uniqueForms = filteredForms.reduce((acc: any[], form: any) => {
      const existingById = acc.find(f => f.id === form.id);
      const existingByName = acc.find(f => f.displayName === form.displayName);
      
      if (existingById) {
        console.log(`[Forms with Real Options] 🔄 DUPLICATE REMOVED (ID): "${form.displayName}" (ID: ${form.id})`);
        return acc;
      }
      
      if (existingByName) {
        console.log(`[Forms with Real Options] 🔄 DUPLICATE REMOVED (NAME): "${form.displayName}" (ID: ${form.id}) - keeping first occurrence`);
        return acc;
      }
      
      acc.push(form);
      return acc;
    }, []);

    console.log(`[Forms with Real Options] After filtering and deduplication: ${uniqueForms.length} unique forms (removed ${formsWithOptions.length - uniqueForms.length} forms)`);

    console.log(`[Forms with Real Options] Returning ${uniqueForms.length} filtered forms with real options`);

    return NextResponse.json({
      forms: uniqueForms,
      selectOptions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Forms with Real Options] Error:', error);
    return NextResponse.json(
      { error: `Failed to get forms with real options: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}



