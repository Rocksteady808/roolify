import { NextResponse } from 'next/server';
import { getTokenForSite } from '../../../../lib/webflowStore';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Get the actual Webflow form data
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

    console.log(`[Real Webflow Data] Found ${webflowForms.length} forms from Webflow API`);

    // For each form, get the actual field data with real options
    const formsWithRealData = webflowForms.map((form: any) => {
      const fieldsWithRealData = Object.entries(form.fields || {}).map(([fieldId, fieldData]: [string, any]) => {
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: (fieldData.type || '').toString().toLowerCase(),
          displayName: fieldData.displayName || fieldData.name || fieldId,
          elementId: fieldData._id || undefined,
          options: undefined
        };

        // For select fields, try to get the actual options from Webflow
        if (fieldData.type === 'Select') {
          // Check if the field has options in the Webflow data
          if (fieldData.options && Array.isArray(fieldData.options)) {
            field.options = fieldData.options.map((option: any) => 
              typeof option === 'string' ? option : (option.label || option.value || option.name || option)
            );
            console.log(`[Real Webflow Data] Found options for ${field.name}:`, field.options);
          } else {
            // If no options in Webflow data, try to get them from the published site
            console.log(`[Real Webflow Data] No options found in Webflow data for ${field.name}, will try site scan`);
          }
        }

        return field;
      });

      return {
        id: form.id || form._id,
        name: form.displayName || form.name || form.slug || form.id,
        fields: fieldsWithRealData
      };
    });

    console.log(`[Real Webflow Data] Returning ${formsWithRealData.length} forms with real Webflow data`);

    return NextResponse.json({
      forms: formsWithRealData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Real Webflow Data] Error:', error);
    return NextResponse.json(
      { error: `Failed to get real Webflow data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}



