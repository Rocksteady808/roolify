import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = '68bc42f58e22a62ce5c282e0';
  
  try {
    // Call the form-specific endpoint with multiPage=true
    const response = await fetch(`${url.origin}/api/forms/form-specific?siteId=${siteId}&multiPage=true&_refresh=${Date.now()}`);
    
    // This will trigger the multi-page scan, we just need to check the terminal logs
    // But we can't access those logs from here
    
    // Instead, let's check what elements were found by looking at the State Form 2
    // which is a scanner-detected form
    const data = await response.json();
    
    const stateForm2 = data.forms.find((f: any) => f.name === 'State Form 2');
    const exampleForm = data.forms.find((f: any) => f.name?.includes('Example'));
    
    return NextResponse.json({
      scanTriggered: true,
      stateForm2: {
        name: stateForm2?.name,
        id: stateForm2?.id,
        fieldCount: stateForm2?.fields?.length,
        source: stateForm2?.id?.startsWith('wf-form') ? 'scanner' : 'webflow_api'
      },
      exampleForm: {
        name: exampleForm?.name,
        id: exampleForm?.id,
        fieldCount: exampleForm?.fields?.length,
        fields: exampleForm?.fields?.map((f: any) => f.name),
        source: exampleForm?.id?.startsWith('wf-form') ? 'scanner' : 'webflow_api'
      },
      recommendation: "Check the Next.js terminal for lines starting with '📍 Scanning page: testing-2' to see if it was scanned"
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}












