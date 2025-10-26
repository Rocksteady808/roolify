import { NextResponse } from 'next/server';

/**
 * Test endpoint for dynamic options
 * GET /api/test/dynamic-options?siteId=xxx
 * 
 * This endpoint tests the dynamic-options functionality and returns
 * detailed information about what's being found.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    console.log(`[Test Dynamic Options] Testing for site ${siteId}...`);

    // Call the dynamic-options endpoint
    const baseUrl = req.url.split('/api')[0];
    const response = await fetch(`${baseUrl}/api/forms/dynamic-options?siteId=${siteId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Failed to fetch dynamic options: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Analyze the results
    const analysis = {
      totalForms: data.forms?.length || 0,
      totalFields: 0,
      selectFields: 0,
      fieldsWithOptions: 0,
      fieldsWithoutOptions: 0,
      hbiFieldFound: false,
      hbiFieldOptions: null,
      selectOptionsFound: data.selectOptions?.length || 0
    };

    data.forms?.forEach((form: any) => {
      analysis.totalFields += form.fields?.length || 0;
      
      form.fields?.forEach((field: any) => {
        if (field.type === 'select') {
          analysis.selectFields++;
          
          if (field.options && field.options.length > 0) {
            analysis.fieldsWithOptions++;
          } else {
            analysis.fieldsWithoutOptions++;
          }
          
          // Check specifically for HBI Account Rep
          if (field.name === 'HBI Account Rep' || field.name?.includes('HBI Account Rep')) {
            analysis.hbiFieldFound = true;
            analysis.hbiFieldOptions = field.options;
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      siteId,
      analysis,
      forms: data.forms?.map((form: any) => ({
        id: form.id,
        name: form.name,
        fieldCount: form.fields?.length || 0,
        selectFields: form.fields?.filter((f: any) => f.type === 'select').map((f: any) => ({
          name: f.name,
          hasOptions: f.options && f.options.length > 0,
          optionsCount: f.options?.length || 0
        }))
      })),
      timestamp: data.timestamp
    });

  } catch (error) {
    console.error('[Test Dynamic Options] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
