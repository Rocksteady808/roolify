import { NextResponse } from 'next/server';
import { getTokenForSite } from '../../../../../../lib/webflowStore';
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    const token = await getTokenForSite(siteId);

    if (!token) {
      return NextResponse.json({ error: "No token found for site" }, { status: 401 });
    }

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

    logger.debug(`[Forms with Options] Found ${forms.length} forms from Webflow API`);

    // For each form, try to scan the published site for select options
    const formsWithOptions = await Promise.all(forms.map(async (form: any) => {
      const fieldsWithOptions = await Promise.all(
        Object.entries(form.fields || {}).map(async ([fieldId, fieldData]: [string, any]) => {
          const field = {
            id: fieldId,
            name: fieldData.displayName || fieldData.name || fieldId,
            type: (fieldData.type || '').toString().toLowerCase(),
            displayName: fieldData.displayName || fieldData.name || fieldId,
            elementId: fieldData._id || undefined,
            options: undefined
          };

          // If it's a select field, try to get options from the published site
          if (fieldData.type === 'Select') {
            try {
              // Try to scan the published site for this specific select element
              const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/webflow/site/${siteId}/scan-options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  url: `https://${form.siteDomainId || siteId}.webflow.io` 
                })
              });

              if (scanResponse.ok) {
                const scanData = await scanResponse.json();
                const selectElement = scanData.selectElements?.find((el: any) => 
                  el.id === fieldId || el.name === field.name
                );
                
                if (selectElement && selectElement.options) {
                  field.options = selectElement.options;
                  logger.debug(`[Forms with Options] Found options for ${field.name}:`, selectElement.options);
                }
              }
            } catch (scanError) {
              console.warn(`[Forms with Options] Failed to scan options for ${field.name}:`, scanError);
            }
          }

          return field;
        })
      );

      return {
        id: form.id || form._id,
        name: form.displayName || form.name || form.slug || form.id,
        fields: fieldsWithOptions
      };
    }));

    logger.debug(`[Forms with Options] Returning ${formsWithOptions.length} forms with options`);

    return NextResponse.json({
      forms: formsWithOptions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Forms with Options] Error:', error);
    return NextResponse.json(
      { error: `Failed to get forms with options: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
