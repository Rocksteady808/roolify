import { NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';
import { getCurrentUserId } from '@/lib/serverAuth';

/**
 * Unified Forms API using Xano backend
 * GET /api/forms/xano?siteId=xxx - Get all forms for a site from Xano
 * POST /api/forms/xano - Create/update form in Xano
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ 
        error: "siteId parameter required" 
      }, { 
        status: 400
      });
    }

    // Get all forms from Xano
    const allForms = await xanoForms.getAll();
    
    // Filter by siteId if provided
    let siteForms = allForms.filter(form => form.site_id === siteId);
    
    console.log(`[Forms Xano API] Returning ${siteForms.length} forms from Xano`);
    
    return NextResponse.json({ 
      siteId, 
      forms: siteForms,
      count: siteForms.length,
      source: 'xano'
    });
    
  } catch (err) {
    console.error("[Forms Xano API] Error fetching forms:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { 
      status: 500
    });
  }
}

/**
 * POST /api/forms/xano
 * Manual form sync endpoint (admin use only)
 * This should NOT be called automatically - only for manual form management
 */
export async function POST(req: Request) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await req.json();
    const { name, siteId, htmlFormId, pageUrl, formFields } = body;

    if (!name || !siteId) {
      return NextResponse.json({ 
        error: "name and siteId are required" 
      }, { 
        status: 400
      });
    }

    // Smart sync form to Xano (prevents duplicates)
    const syncedForm = await xanoForms.sync({
      html_form_id: htmlFormId || name,
      name,
      site_id: siteId,
      page_url: pageUrl || '',
      form_fields: formFields || [],
      user_id: userId
    });

    console.log(`[Forms Xano API] Smart synced form "${name}" to Xano with ID: ${syncedForm.id}`);

    return NextResponse.json({ 
      success: true,
      form: syncedForm
    });
    
  } catch (err) {
    console.error("[Forms Xano API] Error smart syncing form:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { 
      status: 500
    });
  }
}
