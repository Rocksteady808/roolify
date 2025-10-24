import { NextRequest, NextResponse } from 'next/server';
import { xanoSubmissions } from '@/lib/xano';

/**
 * Export submissions to CSV format
 * GET /api/submissions/export
 *
 * Query params:
 * - formId: Filter by form ID (optional)
 * - format: Export format ('csv' or 'json', default: 'csv')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formIdFilter = searchParams.get('formId');
    const format = searchParams.get('format') || 'csv';

    console.log('[Export API] Exporting submissions...', { formIdFilter, format });

    // Load notification settings for the form to get custom field values
    let fieldCustomValues: Record<string, string> | null = null;
    let globalCustomValue: string | null = null;
    if (formIdFilter) {
      try {
        const notifResponse = await fetch(
          `${process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj'}/notification_setting`
        );
        if (notifResponse.ok) {
          const allNotifications = await notifResponse.json();

          // Find settings for this form - check both numeric and string formId
          const numericFormId = /^\d+$/.test(formIdFilter) ? parseInt(formIdFilter) : null;
          const settings = allNotifications.find((n: any) => {
            return n.form === numericFormId || String(n.form) === formIdFilter;
          });

          if (settings) {
            // Parse possible JSON string values from Xano
            if (settings.field_custom_values) {
              try {
                fieldCustomValues = typeof settings.field_custom_values === 'string'
                  ? JSON.parse(settings.field_custom_values)
                  : settings.field_custom_values;
              } catch {
                fieldCustomValues = null;
              }
              console.log('[Export API] Loaded custom field values:', fieldCustomValues);
            }
            globalCustomValue = settings.custom_value || null;
          }
        }
      } catch (err) {
        console.warn('[Export API] Failed to load notification settings:', err);
      }
    }

    // Fetch all submissions from Xano
    const submissions = await xanoSubmissions.getAll();
    
    console.log(`[Export API] Found ${submissions.length} submissions`);

    // Parse submission_data from JSON string and extract form fields
    // Match the client-side logic from submissions/page.tsx lines 402-407
    const parsedSubmissions = submissions.map((sub, index) => {
      // Parse submission_data - handle double-encoding
      let parsedData: any = sub.submission_data;

      // Keep parsing if it's still a string (handle double/triple encoding)
      while (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          console.error('[Export API] Failed to parse submission_data:', e);
          parsedData = {} as any;
          break;
        }
      }

      // Extract form fields - USE EXACT SAME LOGIC AS SUBMISSION DETAILS PAGE
      // This matches the client-side logic from submissions/page.tsx lines 402-406
      let formFields: any = {};
      let extractionPath = 'none';
      
      if (parsedData && typeof parsedData === 'object') {
        // EXACT SAME LOGIC AS SUBMISSION DETAILS PAGE
        // Support both {data: {...}} and {formData: {...}} structures
        formFields = parsedData.data || parsedData.formData || parsedData;
        extractionPath = 'client-side-match';
        
        // Debug logging to match client-side behavior
        console.log(`[Export API] Processing submission #${sub.id}:`, {
          hasData: !!parsedData.data,
          hasFormData: !!parsedData.formData,
          formFieldsKeys: Object.keys(formFields),
          sample: Object.keys(formFields).slice(0, 3)
        });
      }

      // Enhanced debug logging for first submission only
      if (index === 0) {
        console.log(`[Export API] 🔍 DIAGNOSTIC - First submission #${sub.id}:`);
        console.log(`[Export API] Extraction path:`, extractionPath);
        console.log(`[Export API] Form fields:`, Object.keys(formFields || {}));
        console.log(`[Export API] Sample values:`, Object.entries(formFields).slice(0, 3).map(([k, v]) => `${k}="${v}"`).join(', '));
      }

      return {
        id: sub.id,
        created_at: sub.created_at,
        form_id: sub.form_id,
        user_id: sub.user_id,
        data: formFields,  // Extracted form fields (excluding metadata)
        rawData: parsedData  // Keep original for metadata access
      };
    });

    // Filter by formId if provided
    let filteredSubmissions = parsedSubmissions;
    if (formIdFilter) {
      console.log(`[Export API] 🔍 FILTERING: Looking for formId=${formIdFilter} in ${parsedSubmissions.length} submissions`);
      
      // Get the form name for the filter to enable name-based matching
      let filterFormName = null;
      try {
        const { xanoForms } = await import('@/lib/xano');
        const allForms = await xanoForms.getAll();
        const filterForm = allForms.find(f => String(f.id) === formIdFilter);
        if (filterForm) {
          filterFormName = filterForm.name;
          console.log(`[Export API] 🔍 Found form name for filter: "${filterFormName}"`);
        }
      } catch (err) {
        console.log(`[Export API] ⚠️ Could not load form names for matching:`, err.message);
      }
      
      filteredSubmissions = parsedSubmissions.filter(sub => {
        // Check if the form ID matches
        // Try multiple matching strategies:

        // 1. Direct numeric form_id match (from Xano database)
        if (String(sub.form_id) === formIdFilter) {
          console.log(`[Export API] ✅ MATCH: Submission #${sub.id} matches by form_id: ${sub.form_id} === ${formIdFilter}`);
          return true;
        }

        // 2. HTML form ID from submission metadata
        // Check both rawData (if nested) and data (if flat)
        const htmlFormId = sub.rawData?._htmlFormId || sub.data?._htmlFormId;
        if (htmlFormId === formIdFilter) {
          console.log(`[Export API] ✅ MATCH: Submission #${sub.id} matches by htmlFormId: ${htmlFormId} === ${formIdFilter}`);
          return true;
        }

        // 3. Special handling for HBI form: if filtering by Webflow form ID, also check for the HTML form ID
        if (formIdFilter === '68eb5d8e93a70150aa597336' && htmlFormId === 'wf-form-HBI-International-Inquiry-Form---HBI-International') {
          console.log(`[Export API] ✅ MATCH: Submission #${sub.id} matches by special HBI form logic`);
          return true;
        }

        // 4. CRITICAL FIX: Handle form ID mismatch for same form name
        // If the form names match, allow the submission even if form IDs differ
        // This works for ANY form on ANY site by matching form names
        const formName = sub.rawData?._formName || sub.data?._formName;
        if (formName && filterFormName) {
          console.log(`[Export API] 🔍 Checking form name match: submission="${formName}" vs filter="${filterFormName}"`);
          
          // Match by form name - this works for any form on any site
          if (formName === filterFormName) {
            console.log(`[Export API] ✅ MATCH: Submission #${sub.id} matches by form name: "${formName}" === "${filterFormName}"`);
            return true;
          }
        }

        console.log(`[Export API] ❌ NO MATCH: Submission #${sub.id} (form_id: ${sub.form_id}, htmlFormId: ${htmlFormId}) does not match ${formIdFilter}`);
        return false;
      });
      console.log(`[Export API] Filtered to ${filteredSubmissions.length} submissions for form ${formIdFilter}`);
    }

    if (filteredSubmissions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No submissions found to export'
      }, { status: 404 });
    }

    // Collect all field names from submissions (excluding metadata and system fields)
    // Normalize field names to handle inconsistent naming (Has-Account, Has Account, etc.)
    const fieldMap = new Map<string, { displayName: string; dbVariations: string[] }>();

    // System fields to exclude (not actual form fields)
    // Match the submission details page logic exactly
    const systemFields = new Set(['email', 'token', 'expires_at', 'submissionId', 'type', 'used']);

    // Helper to normalize field names for grouping
    const normalizeForGrouping = (name: string) => {
      return name.toLowerCase().replace(/[-_\s]/g, '').replace(/[^a-z0-9]/g, '');
    };

    // Helper to convert to display format (spaces, title case)
    const toDisplayName = (name: string) => {
      return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    console.log(`[Export API] 🔍 FIELD COLLECTION - Processing ${filteredSubmissions.length} submissions for field mapping`);
    
    // CRITICAL: Use the SAME field extraction logic as in the parsing phase
    // Preserve field order from first submission to maintain alignment
    let fieldOrder: string[] = [];
    
    filteredSubmissions.forEach((submission, index) => {
      const data = submission.data || {};
      const submissionFields = Object.keys(data);
      
      // Only log first submission for debugging
      if (index === 0) {
        console.log(`[Export API] First submission #${submission.id} has fields:`, submissionFields);
        console.log(`[Export API] Sample values:`, Object.entries(data).slice(0, 3).map(([k, v]) => `${k}="${v}"`).join(', '));
        
        // CRITICAL: Capture field order from first submission
        fieldOrder = submissionFields.filter(key => !key.startsWith('_') && !systemFields.has(key));
        console.log(`[Export API] Field order from first submission:`, fieldOrder);
      }
      
      submissionFields.forEach(key => {
        // Exclude internal metadata fields and system fields
        if (!key.startsWith('_') && !systemFields.has(key)) {
          const normalized = normalizeForGrouping(key);
          const displayName = toDisplayName(key);

          // Find if we already have this field (by normalized name)
          let found = false;
          for (const [existingDisplay, info] of fieldMap.entries()) {
            if (normalizeForGrouping(existingDisplay) === normalized) {
              // Add this variation to the list
              if (!info.dbVariations.includes(key)) {
                info.dbVariations.push(key);
              }
              found = true;
              break;
            }
          }

          // If not found, create new entry
          if (!found) {
            fieldMap.set(displayName, { displayName, dbVariations: [key] });
          }
        }
      });
    });

    // CRITICAL FIX: Use field order from first submission instead of alphabetical
    // This ensures CSV headers match the data order exactly
    const sortedFields = fieldOrder.length > 0 ? fieldOrder : Array.from(fieldMap.keys());
    console.log('[Export API] Fields detected (preserving order):', sortedFields);
    console.log('[Export API] Total unique fields:', sortedFields.length);
    console.log('[Export API] Using field order from first submission:', fieldOrder);
    
    // Log complete field mapping for validation
    console.log('[Export API] 🔍 COMPLETE FIELD MAPPING:');
    for (const [displayName, info] of fieldMap.entries()) {
      console.log(`[Export API]   "${displayName}" -> variations: ${JSON.stringify(info.dbVariations)}`);
    }

    // Helper function to get value trying all field variations
    const getFieldValue = (data: any, displayName: string): any => {
      const fieldInfo = fieldMap.get(displayName);
      if (!fieldInfo) {
        console.log(`[Export API] ⚠️  No field info found for displayName: "${displayName}"`);
        return '';
      }

      // Try each variation until we find a value
      for (const variation of fieldInfo.dbVariations) {
        if (data[variation] !== undefined && data[variation] !== null && data[variation] !== '') {
          console.log(`[Export API] ✅ Found value for "${displayName}" using variation "${variation}": "${data[variation]}"`);
          return data[variation];
        }
      }
      
      // CRITICAL FIX: If no variation found, try exact match with displayName
      if (data[displayName] !== undefined && data[displayName] !== null && data[displayName] !== '') {
        console.log(`[Export API] ✅ Found value for "${displayName}" using exact match: "${data[displayName]}"`);
        return data[displayName];
      }
      
      // CRITICAL FIX: Try normalized matching
      const normalizedDisplayName = displayName.toLowerCase().replace(/[-_\s]/g, '');
      for (const [key, value] of Object.entries(data)) {
        const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, '');
        if (normalizedKey === normalizedDisplayName && value !== undefined && value !== null && value !== '') {
          console.log(`[Export API] ✅ Found value for "${displayName}" using normalized match "${key}": "${value}"`);
          return value;
        }
      }
      
      console.log(`[Export API] ❌ No value found for "${displayName}" (tried variations: ${JSON.stringify(fieldInfo.dbVariations)})`);
      return '';
    };

    // Enhanced debug: Show first 3 submissions' field values
    if (filteredSubmissions.length > 0) {
      console.log('[Export API] 🔍 FIELD VALUE MAPPING FOR FIRST 3 SUBMISSIONS:');
      for (let i = 0; i < Math.min(3, filteredSubmissions.length); i++) {
        const sub = filteredSubmissions[i];
        console.log(`[Export API] Submission #${sub.id} (index ${i}):`);
        console.log(`[Export API] Available data keys:`, Object.keys(sub.data || {}));
        
        sortedFields.forEach(displayName => {
          const fieldInfo = fieldMap.get(displayName);
          const value = getFieldValue(sub.data, displayName);
          console.log(`[Export API]   "${displayName}" (variations: ${JSON.stringify(fieldInfo?.dbVariations)}) -> "${value}"`);
        });
        console.log('---');
      }
    }

    if (format === 'json') {
      // Return JSON format
      const exportData = filteredSubmissions.map(submission => {
        const data = submission.data || {};

        return {
          id: submission.id,
          form_id: submission.form_id,
          submitted_at: new Date(submission.created_at).toISOString(),
          form_name: submission.rawData?._htmlFormId || data._htmlFormId || `Form ${submission.form_id}`,
          ...Object.fromEntries(
            sortedFields.map(displayName => {
              let value = getFieldValue(data, displayName);

              // Apply custom field values from notification settings with field name normalization
              if (fieldCustomValues) {
                // Helper to normalize field names for matching
                const normalize = (name: string) => name.toLowerCase().replace(/[-_\s]/g, '').replace(/[^a-z0-9]/g, '');
                const normalizedField = normalize(displayName);

                // Find matching custom value by normalized name
                for (const [customFieldName, customValue] of Object.entries(fieldCustomValues)) {
                  if (normalize(customFieldName) === normalizedField) {
                    // Check if this is a checkbox field that's checked
                    const isChecked = value === 'on' || value === 'true' || value === true;

                    if (isChecked) {
                      value = customValue;
                      break;
                    }
                  }
                }
              }

              // If still a checked checkbox with no per-field value, apply global custom value
              if ((value === 'on' || value === 'true' || value === true) && !fieldCustomValues && globalCustomValue) {
                value = globalCustomValue.replace(/\{\{field\}\}/g, displayName);
              }

              // Hide unchecked checkboxes; if checked and no custom, output boolean true
              if (value === 'off' || value === 'false' || value === false) {
                value = '';
              } else if (value === 'on' || value === 'true' || value === true) {
                if (!fieldCustomValues && !globalCustomValue) {
                  value = 'true';
                }
              }

              return [displayName, value];
            })
          )
        };
      });

      return NextResponse.json({
        success: true,
        format: 'json',
        submissions: exportData,
        count: exportData.length
      });
    }

    // Generate CSV format
    const fieldNames = ['ID', 'Form', 'Submitted At', ...sortedFields];
    const csvRows = [];
    
    // Add header row
    csvRows.push(fieldNames.map(f => `"${f}"`).join(','));

    // Add data rows
    console.log(`[Export API] 🔍 CSV GENERATION - Creating ${filteredSubmissions.length} data rows`);
    
    filteredSubmissions.forEach((submission, index) => {
      const data = submission.data || {};
      const formName = submission.rawData?._htmlFormId || data._htmlFormId || `Form ${submission.form_id}`;
      
      // Format timestamp - use Excel-safe format with quotes to prevent parsing issues
      const date = new Date(submission.created_at);
      const submittedAt = `"${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}"`;

      // Log first submission's CSV row generation for debugging
      if (index === 0) {
        console.log(`[Export API] 🔍 CSV ROW GENERATION - First submission #${submission.id}:`);
        console.log(`[Export API] Available data keys:`, Object.keys(data));
        console.log(`[Export API] CSV headers:`, sortedFields);
      }

      const row = [
        `"${String(submission.id)}"`,
        `"${String(formName).replace(/"/g, '""')}"`,
        `"${String(submittedAt)}"`,
        ...sortedFields.map((displayName, fieldIndex) => {
          let value = getFieldValue(data, displayName);

          // Log field mapping for first submission only
          if (index === 0) {
            console.log(`[Export API]   Field ${fieldIndex}: "${displayName}" -> "${value}"`);
          }

          // Apply custom field values from notification settings with field name normalization
          if (fieldCustomValues) {
            // Helper to normalize field names for matching
            const normalize = (name: string) => name.toLowerCase().replace(/[-_\s]/g, '').replace(/[^a-z0-9]/g, '');
            const normalizedField = normalize(displayName);

            // Find matching custom value by normalized name
            for (const [customFieldName, customValue] of Object.entries(fieldCustomValues)) {
              if (normalize(customFieldName) === normalizedField) {
                // Check if this is a checkbox field that's checked
                const isChecked = value === 'on' || value === 'true' || value === true;

                if (isChecked) {
                  value = customValue;
                  if (index === 0) {
                    console.log(`[Export API]     Applied custom value: "${customValue}"`);
                  }
                  break;
                }
              }
            }
          }

          // If still a checked checkbox with no per-field value, apply global custom value
          if ((value === 'on' || value === 'true' || value === true) && !fieldCustomValues && globalCustomValue) {
            value = globalCustomValue.replace(/\{\{field\}\}/g, displayName);
            if (index === 0) {
              console.log(`[Export API]     Applied global custom value: "${value}"`);
            }
          }

          // Hide unchecked checkboxes; if checked and no custom, output boolean true
          if (value === 'off' || value === 'false' || value === false) {
            value = '';
          } else if (value === 'on' || value === 'true' || value === true) {
            if (!fieldCustomValues && !globalCustomValue) {
              value = 'true';
            }
          }

          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        })
      ];
      
      if (index === 0) {
        console.log(`[Export API] Final CSV row for first submission #${submission.id}:`, row.slice(0, 5)); // Show first 5 columns
      }
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="form-submissions-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to export submissions'
      },
      { status: 500 }
    );
  }
}
