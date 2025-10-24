import { NextResponse } from 'next/server';
import { saveFormsForSite } from "../../../../lib/formsStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { siteId, forms } = body;
    
    if (!siteId || !forms) {
      return NextResponse.json({ 
        error: "siteId and forms required" 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    console.log(`Received form data for site: ${siteId}`, {
      formCount: forms.length,
      forms: forms.map((f: any) => ({
        formId: f.formId,
        fieldCount: f.fields?.length || 0,
        url: f.url
      }))
    });

    // Save forms to store
    saveFormsForSite(siteId, forms);
    
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${forms.length} forms for site ${siteId}`,
      received: forms.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (err) {
    console.error("Error processing global form data:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ 
        error: "siteId parameter required" 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Return form data for the site
    const { getFormsForSite } = await import("../../../../lib/formsStore");
    const forms = getFormsForSite(siteId);
    
    return NextResponse.json({ 
      siteId, 
      forms: forms || [],
      count: forms?.length || 0
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (err) {
    console.error("Error fetching global form data:", err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err) 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}
