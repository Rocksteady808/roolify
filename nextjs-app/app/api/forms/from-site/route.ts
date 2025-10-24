import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Scan the published site for forms and select options
    // Try to get the actual published URL for this site
    const siteUrl = `https://${siteId}.webflow.io`; // Use siteId to construct URL
    const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: siteUrl })
    });

    if (!scanResponse.ok) {
      throw new Error(`Failed to scan site: ${scanResponse.status}`);
    }

    const scanData = await scanResponse.json();
    const selectElements = scanData.selectElements || [];
    
    console.log(`[Forms from Site] Found ${selectElements.length} select elements with options`);

    // Create forms based on the scanned select elements
    const forms = [];
    const formGroups = new Map();

    selectElements.forEach((select: any) => {
      const formId = select.formId || 'form-' + Date.now();
      
      if (!formGroups.has(formId)) {
        formGroups.set(formId, {
          id: formId,
          name: `Form with ${select.name}`,
          fields: []
        });
      }

      const form = formGroups.get(formId);
      form.fields.push({
        id: select.id,
        name: select.name,
        type: 'select',
        displayName: select.name,
        elementId: select.id,
        options: select.options
      });
    });

    // Convert map to array
    forms.push(...formGroups.values());

    console.log(`[Forms from Site] Created ${forms.length} forms from site scan`);

    return NextResponse.json({
      forms,
      selectElements,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Forms from Site] Error:', error);
    return NextResponse.json(
      { error: `Failed to get forms from site: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}



