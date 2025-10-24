import { NextResponse } from 'next/server';
import { getTokenForSite } from '../../../../lib/webflowStore';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Get ALL forms from Webflow API first
    const token = getTokenForSite(siteId);
    if (!token) {
      return NextResponse.json({ error: "No token found for site" }, { status: 401 });
    }

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
    const webflowForms = formsData.forms || [];

    console.log(`[All Forms with Options] Found ${webflowForms.length} forms from Webflow API`);

    // Scan the published site for select options
    const siteUrl = `https://${siteId}.webflow.io`;
    const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: siteUrl })
    });

    let selectOptions: any[] = [];
    if (scanResponse.ok) {
      const scanData = await scanResponse.json();
      selectOptions = scanData.selectElements || [];
      console.log(`[All Forms with Options] Found ${selectOptions.length} select elements with options from site scan`);
    }

    // Enhance ALL Webflow forms with real select options
    const enhancedForms = webflowForms.map((form: any) => {
      const fieldsWithOptions = Object.entries(form.fields || {}).map(([fieldId, fieldData]: [string, any]) => {
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: (fieldData.type || '').toString().toLowerCase(),
          displayName: fieldData.displayName || fieldData.name || fieldId,
          elementId: fieldData._id || undefined,
          options: undefined
        };

        // If it's a select field, try to find matching options from the site scan
        if (fieldData.type === 'Select') {
          const matchingSelect = selectOptions.find((select: any) => 
            select.id === fieldId || 
            select.name === field.name ||
            select.id === fieldData._id ||
            select.name === fieldData.displayName
          );
          
          if (matchingSelect && matchingSelect.options) {
            field.options = matchingSelect.options;
            console.log(`[All Forms with Options] Found options for ${field.name}:`, matchingSelect.options);
          }
        }

        return field;
      });

      return {
        id: form.id || form._id,
        name: form.displayName || form.name || form.slug || form.id,
        fields: fieldsWithOptions
      };
    });

    console.log(`[All Forms with Options] Returning ${enhancedForms.length} enhanced forms`);

    return NextResponse.json({
      forms: enhancedForms,
      selectOptions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[All Forms with Options] Error:', error);
    return NextResponse.json(
      { error: `Failed to get all forms with options: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}



