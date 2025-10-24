import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = '68bc42f58e22a62ce5c282e0';
  
  try {
    // 1. Get Example form from Webflow API
    const webflowResponse = await fetch(`${url.origin}/api/webflow/site/${siteId}/forms`);
    const webflowData = await webflowResponse.json();
    const exampleForm = webflowData.forms.find((f: any) => f.displayName?.includes('Example'));
    
    // 2. Calculate htmlId for Example form
    const calculatedHtmlId = exampleForm ? 
      (exampleForm.htmlId || `wf-form-${(exampleForm.displayName || exampleForm.name || '').replace(/\s+/g, '-')}`) : 
      null;
    
    // 3. Get scanned elements
    const scanResponse = await fetch(`${url.origin}/api/scan/fresh-html?url=https://flow-forms-f8b3f7.webflow.io/testing-2`);
    const scanData = await scanResponse.json();
    const exampleElements = scanData.elements.filter((el: any) => 
      el.formId?.includes('Example') || el.formName?.includes('Example')
    );
    
    // 4. Check if they match
    const matches = exampleElements.map((el: any) => ({
      elementId: el.id,
      elementFormId: el.formId,
      exactMatch: el.formId === calculatedHtmlId,
      lengths: {
        elementFormId: el.formId?.length,
        calculatedHtmlId: calculatedHtmlId?.length
      }
    }));
    
    // Now test the actual filter logic
    const formHtmlId = calculatedHtmlId;
    const filterResults = exampleElements.map((element: any) => {
      const elementFormId = element.formId;
      const exactStringMatch = elementFormId === formHtmlId;
      const withNullCheck = elementFormId && formHtmlId && elementFormId === formHtmlId;
      
      return {
        elementId: element.id,
        elementFormId,
        formHtmlId,
        exactStringMatch,
        withNullCheck,
        shouldMatch: true
      };
    });
    
    return NextResponse.json({
      hbiForm: {
        id: hbiForm?.id,
        displayName: hbiForm?.displayName,
        originalHtmlId: hbiForm?.htmlId ?? 'NOT_SET',
        calculatedHtmlId: calculatedHtmlId,
        htmlIdType: typeof hbiForm?.htmlId
      },
      filterTest: {
        sampleElement: filterResults[0],
        allWouldMatch: filterResults.every((r: any) => r.withNullCheck),
        problemElements: filterResults.filter((r: any) => !r.withNullCheck)
      },
      hbiElementsFound: hbiElements.length,
      matchResults: matches,
      summary: {
        allMatch: matches.every((m: any) => m.exactMatch),
        someMatch: matches.some((m: any) => m.exactMatch),
        noneMatch: matches.every((m: any) => !m.exactMatch)
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

