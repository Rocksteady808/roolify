import { NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';
import { getCurrentUserId } from '@/lib/serverAuth';

/**
 * GET /api/forms/notifications?siteId=xxx
 *
 * ⚠️ READ-ONLY ENDPOINT ⚠️
 *
 * This endpoint is specifically designed for the notifications page.
 * It ONLY reads existing forms from the Xano database - it does NOT sync or create new forms.
 *
 * Purpose:
 * - Returns forms that already exist in Xano for the specified site
 * - Enhances forms with field details AND select options from dynamic-options API
 * - Used by notifications page to display available forms for notification settings
 *
 * Data Flow:
 * 1. Reads existing forms from Xano (by site_id)
 * 2. Calls /api/forms/dynamic-options to get field details with select options
 * 3. Matches and merges the data to provide complete form information
 *
 * Important:
 * - This endpoint will NOT create duplicate form records
 * - If no forms exist in Xano, returns an empty array
 * - Users must sync forms separately via the dashboard before using notification settings
 * - Select field options are sourced from Webflow Designer API via dynamic-options
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    console.log(`[Forms Notifications] Getting forms for site: ${siteId}`);

    // Get authenticated user ID
    const userId = await getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Step 1: Get existing forms from Xano
    const allForms = await xanoForms.getAll();
    const siteForms = allForms.filter(form => 
      form.site_id === siteId && form.user_id === userId
    );
    
    console.log(`[Forms Notifications] Found ${siteForms.length} existing forms in Xano for user ${userId}`);

    // Step 2: If no forms exist, return empty array (no syncing)
    if (siteForms.length === 0) {
      console.log(`[Forms Notifications] No forms found in Xano for site ${siteId}`);
      return NextResponse.json({
        siteId,
        forms: [],
        count: 0,
        source: 'xano-empty'
      });
    }

    // Step 3: Get field details with options from dynamic-options endpoint
    // This endpoint includes select field options from the Webflow Designer API
    let enhancedForms = siteForms;

    try {
      console.log(`[Forms Notifications] Getting enhanced field data with options...`);
      const baseUrl = req.url.split('/api')[0];
      
      // Forward auth headers to internal API call
      const authHeader = req.headers.get('authorization');
      const headers: Record<string, string> = {};
      if (authHeader) {
        headers['authorization'] = authHeader;
      }
      
      const dynamicOptionsResp = await fetch(`${baseUrl}/api/forms/dynamic-options?siteId=${encodeURIComponent(siteId)}`, {
        headers
      });

      if (dynamicOptionsResp.ok) {
        const dynamicData = await dynamicOptionsResp.json();
        const dynamicForms = dynamicData.forms || [];

        console.log(`[Forms Notifications] Found ${dynamicForms.length} forms with dynamic options`);
        
        // Debug: Log what we're trying to match
        console.log(`[Forms Notifications] Xano forms:`, siteForms.map(f => ({ 
          name: f.name, 
          html_form_id: f.html_form_id 
        })));
        console.log(`[Forms Notifications] Dynamic forms:`, dynamicForms.map((f: any) => ({ 
          id: f.id, 
          name: f.name, 
          fieldCount: f.fields?.length || 0 
        })));

        // Match Xano forms with dynamic forms to get field details with options
        enhancedForms = siteForms.map((xanoForm: any) => {
          // Try multiple matching strategies for better reliability
          const dynamicForm = dynamicForms.find((df: any) => {
            // Strategy 1: Exact id match
            if (df.id === xanoForm.html_form_id) return true;
            
            // Strategy 2: Name match (case-insensitive, normalized)
            const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
            if (normalize(df.name) === normalize(xanoForm.name)) return true;
            
            return false;
          });

          if (dynamicForm && dynamicForm.fields) {
            console.log(`[Forms Notifications] ✅ MATCHED: "${xanoForm.name}" with ${dynamicForm.fields.length} fields`);
            // Debug: Log a sample field to verify options
            const sampleField = dynamicForm.fields.find((f: any) => f.type?.toLowerCase() === 'select' && f.options?.length > 0);
            if (sampleField) {
              console.log(`[Forms Notifications] Sample select field "${sampleField.name}" has ${sampleField.options.length} options:`, sampleField.options.slice(0, 3));
            }
            return {
              ...xanoForm,
              fields: dynamicForm.fields // Fields already include options from dynamic-options API
            };
          }

          console.log(`[Forms Notifications] ❌ NO MATCH: "${xanoForm.name}" (html_form_id: ${xanoForm.html_form_id})`);
          return xanoForm;
        });

        console.log(`[Forms Notifications] Successfully enhanced ${enhancedForms.length} forms with field options`);
      } else {
        console.warn(`[Forms Notifications] Dynamic options API failed, falling back to basic field data`);
      }
    } catch (dynamicError) {
      console.warn(`[Forms Notifications] Failed to get dynamic field options:`, dynamicError);
      // Continue with Xano forms only
    }

    // Note: Select field options are now retrieved from the dynamic-options endpoint above
    // No need for additional site scanning since dynamic-options handles it

    // Apply comprehensive filtering to exclude utility/template forms
    const filteredForms = enhancedForms.filter((form: any) => {
      const formName = form.name || '';
      const formPageUrl = form.page_url || '';

      // FILTER 1: Exclude test forms
      if (formName.toLowerCase().includes('test')) {
        console.log(`[Forms Notifications] ❌ FILTERED (Test form): "${formName}"`);
        return false;
      }

      // FILTER 2: Exclude forms from Utility Pages folder
      // This checks if the page URL or form metadata indicates it's in a Utility Pages folder
      if (formPageUrl.includes('Utility Pages') || formName.includes('Utility Pages')) {
        console.log(`[Forms Notifications] ❌ FILTERED (Utility Pages folder): "${formName}"`);
        return false;
      }

      // FILTER 3: Exclude forms from specific utility/template pages by name
      const utilityPageNames = ['Style Guide', 'style-guide', 'Password', '404', 'Utility'];
      const matchedUtilityName = utilityPageNames.find(utilityName =>
        formPageUrl.toLowerCase().includes(utilityName.toLowerCase()) ||
        formName.toLowerCase().includes(utilityName.toLowerCase())
      );

      if (matchedUtilityName) {
        console.log(`[Forms Notifications] ❌ FILTERED (Utility page "${matchedUtilityName}"): "${formName}"`);
        return false;
      }

      // Form passed all filters
      console.log(`[Forms Notifications] ✅ KEEPING: "${formName}"`);
      return true;
    });

    console.log(`[Forms Notifications] Returning ${filteredForms.length} forms for notifications (filtered from ${enhancedForms.length})`);

    return NextResponse.json({
      siteId,
      forms: filteredForms,
      count: filteredForms.length,
      source: 'xano-enhanced'
    });

  } catch (error) {
    console.error("[Forms Notifications] Error:", error);
    return NextResponse.json({ 
      error: (error as Error).message || String(error) 
    }, { 
      status: 500
    });
  }
}
