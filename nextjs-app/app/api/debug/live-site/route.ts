import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to inspect live Webflow site
 * Helps identify field IDs, radio button values, and script embedding status
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl') || 'https://flow-forms-f8b3f7.webflow.io/testing-2';
    
    console.log(`[Live Site Debug] Inspecting site: ${siteUrl}`);
    
    // Fetch the live site HTML
    const response = await fetch(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch site: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`[Live Site Debug] Fetched ${html.length} characters of HTML`);
    
    // Parse HTML to extract information
    const diagnostics = {
      siteUrl,
      timestamp: new Date().toISOString(),
      htmlLength: html.length,
      scripts: [],
      forms: [],
      radioButtons: [],
      selectElements: [],
      potentialFieldIds: []
    };
    
    // Extract script tags
    const scriptMatches = html.match(/<script[^>]*src="([^"]*)"[^>]*>/gi) || [];
    diagnostics.scripts = scriptMatches.map(match => {
      const srcMatch = match.match(/src="([^"]*)"/);
      return {
        fullTag: match,
        src: srcMatch ? srcMatch[1] : null,
        isRoolify: match.includes('roolify') || match.includes('script/unified') || match.includes('script/serve')
      };
    });
    
    // Extract form elements
    const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
    diagnostics.forms = formMatches.map((form, index) => {
      const idMatch = form.match(/id="([^"]*)"/);
      const nameMatch = form.match(/name="([^"]*)"/);
      return {
        index,
        id: idMatch ? idMatch[1] : null,
        name: nameMatch ? nameMatch[1] : null,
        hasId: !!idMatch,
        hasName: !!nameMatch
      };
    });
    
    // Extract radio buttons
    const radioMatches = html.match(/<input[^>]*type="radio"[^>]*>/gi) || [];
    diagnostics.radioButtons = radioMatches.map((radio, index) => {
      const idMatch = radio.match(/id="([^"]*)"/);
      const nameMatch = radio.match(/name="([^"]*)"/);
      const valueMatch = radio.match(/value="([^"]*)"/);
      const checkedMatch = radio.match(/checked/);
      return {
        index,
        id: idMatch ? idMatch[1] : null,
        name: nameMatch ? nameMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        checked: !!checkedMatch,
        fullTag: radio
      };
    });
    
    // Extract select elements
    const selectMatches = html.match(/<select[^>]*>[\s\S]*?<\/select>/gi) || [];
    diagnostics.selectElements = selectMatches.map((select, index) => {
      const idMatch = select.match(/id="([^"]*)"/);
      const nameMatch = select.match(/name="([^"]*)"/);
      const optionMatches = select.match(/<option[^>]*>([^<]*)<\/option>/gi) || [];
      const options = optionMatches.map(opt => {
        const valueMatch = opt.match(/value="([^"]*)"/);
        const textMatch = opt.match(/>([^<]*)</);
        return {
          value: valueMatch ? valueMatch[1] : null,
          text: textMatch ? textMatch[1].trim() : null
        };
      });
      return {
        index,
        id: idMatch ? idMatch[1] : null,
        name: nameMatch ? nameMatch[1] : null,
        options,
        optionCount: options.length
      };
    });
    
    // Look for potential field IDs (any element with id attribute)
    const idMatches = html.match(/id="([^"]*)"/gi) || [];
    diagnostics.potentialFieldIds = idMatches.map(match => {
      const id = match.replace('id="', '').replace('"', '');
      return {
        id,
        isFormRelated: id.toLowerCase().includes('form') || 
                      id.toLowerCase().includes('field') || 
                      id.toLowerCase().includes('input') ||
                      id.toLowerCase().includes('account') ||
                      id.toLowerCase().includes('hbi') ||
                      id.toLowerCase().includes('ein')
      };
    }).filter(item => item.isFormRelated);
    
    // Look for specific elements mentioned in the rule
    const hasAccountElements = diagnostics.potentialFieldIds.filter(item => 
      item.id.toLowerCase().includes('account') || 
      item.id.toLowerCase().includes('has')
    );
    
    const hbiAccountRepElements = diagnostics.potentialFieldIds.filter(item => 
      item.id.toLowerCase().includes('hbi') || 
      item.id.toLowerCase().includes('rep')
    );
    
    const einNumberElements = diagnostics.potentialFieldIds.filter(item => 
      item.id.toLowerCase().includes('ein') || 
      item.id.toLowerCase().includes('number')
    );
    
    // Check for Roolify script
    const roolifyScripts = diagnostics.scripts.filter(script => script.isRoolify);
    
    console.log(`[Live Site Debug] Found ${diagnostics.scripts.length} scripts, ${diagnostics.forms.length} forms, ${diagnostics.radioButtons.length} radio buttons`);
    console.log(`[Live Site Debug] Roolify scripts: ${roolifyScripts.length}`);
    console.log(`[Live Site Debug] Has Account elements: ${hasAccountElements.length}`);
    console.log(`[Live Site Debug] HBI Account Rep elements: ${hbiAccountRepElements.length}`);
    console.log(`[Live Site Debug] EIN Number elements: ${einNumberElements.length}`);
    
    return NextResponse.json({
      success: true,
      diagnostics: {
        ...diagnostics,
        hasAccountElements,
        hbiAccountRepElements,
        einNumberElements,
        roolifyScripts,
        summary: {
          totalScripts: diagnostics.scripts.length,
          roolifyScripts: roolifyScripts.length,
          totalForms: diagnostics.forms.length,
          totalRadioButtons: diagnostics.radioButtons.length,
          totalSelects: diagnostics.selectElements.length,
          potentialFieldIds: diagnostics.potentialFieldIds.length,
          hasAccountCandidates: hasAccountElements.length,
          hbiAccountRepCandidates: hbiAccountRepElements.length,
          einNumberCandidates: einNumberElements.length
        }
      }
    });
    
  } catch (error) {
    console.error('[Live Site Debug] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Failed to inspect live site: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}







