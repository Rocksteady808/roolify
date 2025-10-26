import { NextResponse } from 'next/server';
import { getTokenForSite } from '@/lib/webflowStore';
import { findMatchingElement, createFieldMapping, SmartField } from '@/lib/field-matching';
import { storeFieldMappings } from '@/lib/field-mappings';
import { getCurrentUserId } from '@/lib/serverAuth';

export async function GET(req: Request) {
  console.log('[Dynamic Options] 🚀 API endpoint called');
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    console.log('[Dynamic Options] 🚀 Site ID:', siteId);
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // 🔒 USER ISOLATION: Verify user authentication and site ownership
    const currentUserId = await getCurrentUserId(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user owns this site
    const { xanoSites } = await import('@/lib/xano');
    const allSites = await xanoSites.getAll();
    const userSite = allSites.find(site => 
      site.webflow_site_id === siteId && site.user_id === currentUserId
    );
    
    if (!userSite) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 403 });
    }

    // Get the working Webflow forms data
    const webflowResponse = await fetch(`${req.url.split('/api')[0]}/api/webflow/site/${siteId}/forms`);
    if (!webflowResponse.ok) {
      throw new Error(`Webflow API error: ${webflowResponse.status}`);
    }

    const webflowData = await webflowResponse.json();
    const webflowForms = webflowData.forms || [];

    console.log(`[Dynamic Options] Found ${webflowForms.length} forms from Webflow API`);

    // 🌐 GLOBAL RULE: Always use APIs for data, never guess
    // Strategy 1: Try Webflow Designer API first (most reliable)
    let selectOptions: any[] = [];
    let siteUrl = '';
    
    try {
          const token = await getTokenForSite(siteId);
          console.log(`[Dynamic Options] 🔍 Attempting Webflow Designer API for form inputs...`);
          
          // Try to get form field definitions from Designer API
          // Use the form inputs endpoint to get field definitions with options
          let designerResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/form-inputs`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept-Version': '2.0.0',
              'Content-Type': 'application/json',
            },
          });

          console.log(`[Dynamic Options] Designer API response status: ${designerResponse.status}`);

          // If that doesn't work, try the forms endpoint
          if (!designerResponse.ok) {
            console.log(`[Dynamic Options] Form inputs endpoint failed (${designerResponse.status}), trying forms endpoint...`);
            designerResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/forms`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Version': '2.0.0',
                'Content-Type': 'application/json',
              },
            });
            console.log(`[Dynamic Options] Forms endpoint response status: ${designerResponse.status}`);
          }

          if (designerResponse.ok) {
            const designerData = await designerResponse.json();
            console.log(`[Dynamic Options] ✅ Designer API returned data:`, JSON.stringify(designerData, null, 2));
            
            // Extract select options from Designer API form data
            if (designerData.items) {
              console.log(`[Dynamic Options] 🔍 Processing ${designerData.items.length} forms from Designer API...`);
              for (const form of designerData.items) {
                console.log(`[Dynamic Options] 🔍 Processing form: ${form.name} (${form.id})`);
                console.log(`[Dynamic Options] 🔍 Form data:`, JSON.stringify(form, null, 2));
                
                if (form.fields) {
                  console.log(`[Dynamic Options] 🔍 Form has ${form.fields.length} fields`);
                  for (const field of form.fields) {
                    console.log(`[Dynamic Options] 🔍 Field: ${field.name} (${field.type})`);
                    console.log(`[Dynamic Options] 🔍 Field data:`, JSON.stringify(field, null, 2));
                    
                    if (field.type === 'Select') {
                      console.log(`[Dynamic Options] 🔍 Select field found: ${field.name}`);
                      console.log(`[Dynamic Options] 🔍 Field options:`, field.options);
                      
                      if (field.options && Array.isArray(field.options) && field.options.length > 0) {
                        const options = field.options.map((opt: any) => {
                          if (typeof opt === 'string') return opt;
                          return opt.label || opt.value || opt.name || opt;
                        });
                        
                        selectOptions.push({
                          id: field.id,
                          name: field.name || field.displayName,
                          options: options,
                          formId: form.id
                        });
                        
                        console.log(`[Dynamic Options] ✅ Added ${options.length} options for ${field.name}:`, options);
                      } else {
                        console.log(`[Dynamic Options] ⚠️ Select field ${field.name} has no options in Designer API`);
                      }
                    }
                  }
                }
              }
            }
            
            if (selectOptions.length > 0) {
              console.log(`[Dynamic Options] ✅ Found ${selectOptions.length} select options from Designer API`);
            }
          } else {
            console.log(`[Dynamic Options] ❌ Designer API failed with status: ${designerResponse.status}`);
            const errorText = await designerResponse.text();
            console.log(`[Dynamic Options] ❌ Designer API error:`, errorText);
          }
        } catch (designerError) {
          console.warn(`[Dynamic Options] Designer API failed:`, designerError);
        }

        // Strategy 2: Try Webflow CMS API for field options
        if (selectOptions.length === 0) {
          console.log(`[Dynamic Options] 🔄 Designer API didn't provide options, trying CMS API...`);
          
          try {
            const token = await getTokenForSite(siteId);
            // Try to get collections and their fields
            const collectionsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/collections`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Version': '2.0.0',
                'Content-Type': 'application/json',
              },
            });

            if (collectionsResponse.ok) {
              const collectionsData = await collectionsResponse.json();
              console.log(`[Dynamic Options] ✅ CMS API returned ${collectionsData.items?.length || 0} collections`);
              
              // Look for select field options in collection fields
              if (collectionsData.items) {
                for (const collection of collectionsData.items) {
                  if (collection.fields) {
                    for (const field of collection.fields) {
                      if (field.type === 'Select' && field.options) {
                        selectOptions.push({
                          id: field.id,
                          name: field.name || field.displayName,
                          options: field.options.map((opt: any) => opt.label || opt.value || opt),
                          formId: collection.id
                        });
                        console.log(`[Dynamic Options] ✅ Found select options in collection ${collection.name}:`, field.options);
                      }
                    }
                  }
                }
              }
            }
          } catch (cmsError) {
            console.warn(`[Dynamic Options] CMS API failed:`, cmsError);
          }
        }

        // Strategy 3: Scan each form's specific page for select options
    console.log(`[Dynamic Options] 📊 Current selectOptions length: ${selectOptions.length}`);
    console.log(`[Dynamic Options] 📊 Will run page scanning: ${selectOptions.length === 0}`);
    if (selectOptions.length === 0) {
      console.log(`[Dynamic Options] 🔄 No API options found, trying page-specific scanning...`);
      console.log(`[Dynamic Options] 🔄 Scanning ${webflowForms.length} forms...`);
      
      // Scan common form pages for this site
      try {
        // TEMPORARY: Hard-code the URL for Flex Flow Web site
        if (siteId === '652b10ed79cbf4ed07a349ed') {
          console.log(`[Dynamic Options] 🔍 Scanning hard-coded URL: https://www.flexflowweb.com/form-test`);
          const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://www.flexflowweb.com/form-test' })
          });
          
          if (scanResponse.ok) {
            const scanData = await scanResponse.json();
            const pageOptions = scanData.selectElements || [];
            selectOptions.push(...pageOptions);
            console.log(`[Dynamic Options] ✅ Found ${pageOptions.length} select elements from hard-coded URL`);
          }
        }
        
        const token = await getTokenForSite(siteId);
        const siteInfoResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Version': '2.0.0',
                'Content-Type': 'application/json',
              },
            });

            if (siteInfoResponse.ok) {
              const siteInfo = await siteInfoResponse.json();
              // Get the correct base URL
              let baseUrl = siteInfo.publishedUrl;
              
              if (!baseUrl && siteInfo.shortName) {
                baseUrl = `https://${siteInfo.shortName}.webflow.io`;
              }
              
              if (!baseUrl && siteInfo.domain) {
                baseUrl = `https://${siteInfo.domain}`;
              }
              
              // Fallback for known sites
              if (!baseUrl && siteId === '652b10ed79cbf4ed07a349ed') {
                baseUrl = 'https://www.flexflowweb.com';
              }
              
              // Force the correct URL for known sites
              if (siteId === '652b10ed79cbf4ed07a349ed') {
                baseUrl = 'https://www.flexflowweb.com';
              }
              
              console.log(`[Dynamic Options] 🔍 Base URL: ${baseUrl}`);
              
              // Scan common form pages
              const commonFormPages = ['/form-test', '/contact', '/contact-us', '/inquiry', '/form'];
              
              for (const pagePath of commonFormPages) {
                const pageUrl = `${baseUrl}${pagePath}`;
                console.log(`[Dynamic Options] 🔍 Scanning: ${pageUrl}`);
                
                try {
                  const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-options`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: pageUrl })
                  });

                  if (scanResponse.ok) {
                    const scanData = await scanResponse.json();
                    const pageOptions = scanData.selectElements || [];
                    if (pageOptions.length > 0) {
                      selectOptions.push(...pageOptions);
                      console.log(`[Dynamic Options] ✅ Found ${pageOptions.length} select elements on ${pagePath}`);
                      break; // Found options, stop scanning other pages
                    }
                  }
                } catch (scanError) {
                  console.warn(`[Dynamic Options] Failed to scan ${pageUrl}:`, scanError);
                }
              }
            }
          } catch (siteError) {
            console.warn(`[Dynamic Options] Failed to get site info:`, siteError);
          }
          
          console.log(`[Dynamic Options] ✅ Total select options found from page scanning: ${selectOptions.length}`);
        }

    // Enhance Webflow forms with dynamic options
    console.log(`[Dynamic Options] 📊 BEFORE field matching - selectOptions length: ${selectOptions.length}`);
    console.log(`[Dynamic Options] 📊 BEFORE field matching - selectOptions:`, selectOptions.map(s => ({ name: s.name, opts: s.options?.length })));
    
    const enhancedForms = webflowForms.map((form: any) => {
      const enhancedFields = Object.entries(form.fields || {}).map(([fieldId, fieldData]: [string, any]) => {
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: (fieldData.type || '').toString().toLowerCase(),
          displayName: fieldData.displayName || fieldData.name || fieldId,
          elementId: fieldData._id || undefined,
          options: undefined as string[] | undefined,
          technicalId: undefined as string | undefined,
          liveName: undefined as string | undefined,
          confidence: undefined as number | undefined,
          aliases: undefined as string[] | undefined
        };
        
        // Safety: ensure type is always lowercase
        if (field.type) {
          field.type = field.type.toLowerCase();
        }

            // For select fields, try to find matching options from site scan
            if (fieldData.type?.toString().toLowerCase() === 'select') {
              console.log(`[Dynamic Options] 🔍 Looking for options for field: "${field.name}" (ID: ${fieldId})`);
              console.log(`[Dynamic Options] 🔍 Total selectOptions available: ${selectOptions.length}`);
              console.log(`[Dynamic Options] 🔍 Available selectOptions:`, selectOptions.map((s: any) => ({ id: s.id, name: s.name, hasOptions: s.options && s.options.length > 0 })));
              
              // Use smart field matching to find the best match
              const match = findMatchingElement(field, selectOptions);
              console.log(`[Dynamic Options] 🔍 Match result:`, match ? `Found "${match.element.name}" (confidence: ${match.confidence})` : 'No match');
              
              if (match) {
                // Create smart field mapping
                const smartField = createFieldMapping(field, match);
                
                // Update field with smart mapping data
                field.technicalId = smartField.technicalId;
                field.liveName = smartField.liveName;
                field.confidence = smartField.confidence;
                field.aliases = smartField.aliases;
                
                // Ensure options are properly set
                field.options = match.element.options || [];
                
                console.log(`[Dynamic Options] ✅ SMART MATCH: "${field.name}" -> "${match.element.name}" (confidence: ${match.confidence})`);
                console.log(`[Dynamic Options] ✅ Options found:`, field.options);
                console.log(`[Dynamic Options] 🔍 Field after update:`, {
                  name: field.name,
                  type: field.type,
                  options: field.options,
                  optionsLength: field.options?.length || 0
                });
              } else {
                console.log(`[Dynamic Options] ❌ No smart match found for ${field.name}`);
                console.log(`[Dynamic Options] 🔍 Field details:`, {
                  name: field.name,
                  id: fieldId,
                  type: field.type
                });
                console.log(`[Dynamic Options] 🔍 Available options:`, selectOptions.map(s => ({ name: s.name, id: s.id })));
                
                // If no site options found, try to get from Webflow field data
                if (fieldData.options && Array.isArray(fieldData.options)) {
                  field.options = fieldData.options.map((option: any) =>
                    typeof option === 'string' ? option : (option.label || option.value || option.name || option)
                  );
                  console.log(`[Dynamic Options] Using Webflow options for ${field.name}:`, field.options);
                } else {
                  console.log(`[Dynamic Options] No options available for ${field.name} - select field without options`);
                  field.options = []; // Empty array instead of undefined
                }
              }
            }

        return field;
      });

          const finalForm = {
            id: form.id || form._id,
            name: form.displayName || form.name || form.slug || form.id,
            fields: enhancedFields
          };
          
          // Debug: Check if HBI Account Rep field has options
          const hbiField = finalForm.fields.find((f: any) => f.name === 'HBI Account Rep');
          if (hbiField) {
            console.log(`[Dynamic Options] 🔍 Final HBI Account Rep field:`, {
              name: hbiField.name,
              type: hbiField.type,
              options: hbiField.options,
              optionsLength: hbiField.options?.length || 0
            });
          }
          
          return finalForm;
    });

    // Note: Scanned elements are used to provide options for existing fields only
    // They are NOT added as separate form fields to avoid duplicates

    // Store field mappings for adaptive detection
    for (const form of enhancedForms) {
      const formFields = form.fields.filter((field: any) => field.technicalId && field.confidence > 0);
      if (formFields.length > 0) {
        storeFieldMappings(siteId, form.id, formFields);
        console.log(`[Dynamic Options] Stored ${formFields.length} field mappings for form ${form.id}`);
      }
    }

    console.log(`[Dynamic Options] Returning ${enhancedForms.length} forms with dynamic options`);
    
    // Final debug: Check the HBI form specifically
    const hbiForm = enhancedForms.find((f: any) => f.name.includes('HBI International'));
    if (hbiForm) {
      console.log(`[Dynamic Options] 🔍 Final HBI form:`, {
        id: hbiForm.id,
        name: hbiForm.name,
        fieldsCount: hbiForm.fields.length,
        hbiField: hbiForm.fields.find((f: any) => f.name === 'HBI Account Rep')
      });
    }

    return NextResponse.json({
      forms: enhancedForms,
      selectOptions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Dynamic Options] Error:', error);
    return NextResponse.json(
      { error: `Failed to get forms with dynamic options: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
