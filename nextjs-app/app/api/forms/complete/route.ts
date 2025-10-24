import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Scan the published site for ALL elements with IDs
    const siteUrl = `https://${siteId}.webflow.io`;
    const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/all-elements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: siteUrl })
    });

    let allElements: any[] = [];
    let selectOptions: any[] = [];
    if (scanResponse.ok) {
      const scanData = await scanResponse.json();
      allElements = scanData.elements || [];
      selectOptions = allElements.filter(el => el.tagName === 'select' && el.options);
      console.log(`[Complete Forms] Found ${allElements.length} elements with IDs from site scan`);
      console.log(`[Complete Forms] Found ${selectOptions.length} select elements with options`);
    }

    // Create ALL your forms based on what we know exists
    const allForms = [
      {
        id: "68e0a4f2b9f73a64398b8e4a",
        name: "HBI International Inquiry Form - HBI International",
        fields: [
          {
            id: "has-account",
            name: "has-account",
            type: "radio",
            displayName: "has-account",
            elementId: "has-account"
          },
          {
            id: "HBI-Rep",
            name: "HBI Rep",
            type: "select",
            displayName: "HBI Rep",
            elementId: "HBI-Rep",
            options: undefined // Options will be populated from site scan
          },
          {
            id: "EIN-Number",
            name: "EIN Number",
            type: "plain",
            displayName: "EIN Number",
            elementId: "EIN-Number"
          },
          {
            id: "Name",
            name: "Name",
            type: "plain",
            displayName: "Name",
            elementId: "Name"
          },
          {
            id: "Company-Name",
            name: "Company Name",
            type: "plain",
            displayName: "Company Name",
            elementId: "Company-Name"
          },
          {
            id: "Email",
            name: "Email",
            type: "email",
            displayName: "Email",
            elementId: "Email"
          },
          {
            id: "Select-Country",
            name: "Select Country",
            type: "select",
            displayName: "Select Country",
            elementId: "Select-Country",
            options: selectOptions.find(s => s.id === "Select-a-Country")?.options || undefined
          },
          {
            id: "Field",
            name: "Field",
            type: "plain",
            displayName: "Field",
            elementId: "Field"
          },
          {
            id: "Privacy-Policy-2",
            name: "Privacy Policy 2",
            type: "checkbox",
            displayName: "Privacy Policy 2",
            elementId: "Privacy-Policy-2"
          },
          {
            id: "Terms-Of-Service",
            name: "Terms Of Service",
            type: "checkbox",
            displayName: "Terms Of Service",
            elementId: "Terms-Of-Service"
          }
        ]
      },
      {
        id: "68cff8d91f818708230a6c5a",
        name: "Question Form",
        fields: [
          {
            id: "Yes",
            name: "Yes",
            type: "checkbox",
            displayName: "Yes",
            elementId: "Yes"
          },
          {
            id: "No",
            name: "No",
            type: "checkbox",
            displayName: "No",
            elementId: "No"
          }
        ]
      },
      {
        id: "68cff42b8fe69063293e7075",
        name: "Country Form",
        fields: [
          {
            id: "Select-a-Country",
            name: "Select a Country",
            type: "select",
            displayName: "Select a Country",
            elementId: "Select-a-Country",
            options: selectOptions.find(s => s.id === "Select-a-Country")?.options || undefined
          }
        ]
      },
      {
        id: "68bc44e9bce2c534f83c8a07",
        name: "State Form",
        fields: [
          {
            id: "Name",
            name: "Name",
            type: "plain",
            displayName: "Name",
            elementId: "Name"
          },
          {
            id: "Select-a-State",
            name: "Select a State",
            type: "select",
            displayName: "Select a State",
            elementId: "Select-a-State",
            options: selectOptions.find(s => s.id === "Select-a-State")?.options || undefined
          }
        ]
      }
    ];

    // Add all elements with IDs to each form for show/hide functionality
    allForms.forEach(form => {
      // Add all scanned elements as potential show/hide targets
      allElements.forEach(element => {
        // Skip if it's already a form field
        const isFormField = form.fields.some(field => field.elementId === element.id);
        if (!isFormField) {
          form.fields.push({
            id: element.id,
            name: element.id,
            type: element.tagName,
            displayName: element.id,
            elementId: element.id,
            isShowHideTarget: true // Mark as show/hide target
          } as any);
        }
      });
    });

    console.log(`[Complete Forms] Returning ${allForms.length} complete forms with real select options and show/hide targets`);

    return NextResponse.json({
      forms: allForms,
      selectOptions,
      allElements,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Complete Forms] Error:', error);
    return NextResponse.json(
      { error: `Failed to get complete forms: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
