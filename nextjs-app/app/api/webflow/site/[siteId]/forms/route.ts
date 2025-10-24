import { NextResponse } from 'next/server';
import { getTokenForSite } from "../../../../../../lib/webflowStore";
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: { siteId: string } }) {
  try {
    const { siteId } = params;
    if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

    // Check for bypass mode for diagnosis
    const url = new URL(req.url);
    const bypass = url.searchParams.get('bypass') === 'true';
    if (bypass) {
      console.log('[Webflow Forms API] 🚨 BYPASS MODE ENABLED - All filtering disabled for diagnosis');
    }

    const rec = await getTokenForSite(siteId);
    if (!rec || !rec.token) return NextResponse.json({ error: "no token for site" }, { status: 404 });

    // Add timestamp to URL to prevent Webflow API caching
    const webflowUrl = `https://api.webflow.com/v2/sites/${encodeURIComponent(siteId)}/forms?t=${Date.now()}`;
    
    const resp = await fetch(webflowUrl, {
      headers: { 
        Authorization: `Bearer ${rec.token}`, 
        "Accept-Version": "2.0.0", 
        Accept: "application/json",
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store' // Disable Next.js fetch cache
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: "failed fetching forms", status: resp.status, details: txt }, { status: 502 });
    }

    const data = await resp.json();

    // Enhanced debug logging to diagnose form detection issues
    console.log('[Webflow Forms API] ==========================================');
    console.log('[Webflow Forms API] 🎯 REQUESTED SITE ID:', siteId);
    console.log('[Webflow Forms API] 📊 Forms count from Webflow:', data.forms?.length || 0);
    console.log('[Webflow Forms API] ==========================================');

    // COMPREHENSIVE LOGGING: Log each form with ALL available metadata
    data.forms?.forEach((f: any, index: number) => {
      console.log(`[Webflow Forms API] 📋 Form ${index + 1} DETAILS:`, {
        formId: f.id,
        displayName: f.displayName,
        name: f.name,
        pageName: f.pageName,
        pageId: f.pageId,
        pageSlug: f.page?.slug,
        pageTitle: f.page?.title,
        siteId: f.siteId || 'NOT_IN_RESPONSE',
        htmlId: f.htmlId,
        siteDomainId: f.siteDomainId,
        createdOn: f.createdOn,
        updatedOn: f.updatedOn,
        // Log all available fields to see what we're working with
        allFields: Object.keys(f)
      });

      // Check if form's siteId matches requested siteId (if available in response)
      if (f.siteId && f.siteId !== siteId) {
        console.warn(`[Webflow Forms API] ⚠️  SITE MISMATCH: Form "${f.displayName}" has siteId "${f.siteId}" but we requested "${siteId}"`);
      }
    });

    logger.debug('Webflow Forms API response for site', { siteId, formsCount: data.forms?.length || 0 });

    // BYPASS MODE: Skip all filtering if bypass=true
    if (bypass) {
      console.log('[Webflow Forms API] 🚨 BYPASS MODE: Returning ALL forms without filtering');
      return NextResponse.json({
        ...data,
        forms: data.forms || [],
        bypass: true,
        originalCount: data.forms?.length || 0
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // SERVER-SIDE FILTERING:
    // 1. Ensure forms belong to the requested site
    // 2. Filter out forms from Style Guide page
    const allForms = data.forms || [];

    console.log('[Webflow Forms API] 🔍 Starting server-side filtering...');
    console.log(`[Webflow Forms API] 📊 Processing ${allForms.length} forms for filtering`);

    const filteredForms = allForms.filter((form: any) => {
      const pageName = form.pageName || '';
      const pageSlug = form.page?.slug || '';
      const pageTitle = form.page?.title || '';
      const displayName = form.displayName || form.name || '';
      const formSiteId = form.siteId;

      console.log(`[Webflow Forms API] 🔍 Evaluating form: "${displayName}"`);
      console.log(`[Webflow Forms API] 📄 Page details: name="${pageName}", slug="${pageSlug}", title="${pageTitle}"`);
      console.log(`[Webflow Forms API] 🏠 Site details: formSiteId="${formSiteId}", requestedSiteId="${siteId}"`);
      
      // TEMPORARY DEBUG: Log all forms being evaluated
      if (displayName.includes('Contact') || displayName.includes('Logo')) {
        console.log(`[Webflow Forms API] 🚨 DEBUG: Evaluating ${displayName} on ${pageName}`);
      }

      // FILTER 1: Verify site ownership (if siteId is present in form data)
      if (formSiteId && formSiteId !== siteId) {
        console.log(`[Webflow Forms API] ❌ FILTERED (Wrong site): "${displayName}" belongs to site "${formSiteId}", not "${siteId}"`);
        return false;
      }

      // FILTER 2: Exclude forms from Utility Pages folder
      if (pageName.includes('Utility Pages')) {
        console.log(`[Webflow Forms API] ❌ FILTERED (Utility Pages folder): "${displayName}" on "${pageName}"`);
        return false;
      }

      // FILTER 3: Exclude forms from specific utility/template pages by name
      const utilityPageNames = ['Style Guide', 'Password', '404', 'Utility'];
      
      // Check multiple possible fields where page name might be stored
      const pageNameFields = [
        pageName,
        form.pageName,
        form.page?.name,
        form.page?.title,
        form.page?.slug
      ].filter(Boolean); // Remove null/undefined values
      
      const matchedUtilityName = utilityPageNames.find(utilityName => 
        pageNameFields.some(field => 
          field.toLowerCase().includes(utilityName.toLowerCase())
        )
      );

      if (matchedUtilityName) {
        console.log(`[Webflow Forms API] ❌ FILTERED (Utility page by name "${matchedUtilityName}"): "${displayName}" on "${pageName}"`);
        console.log(`[Webflow Forms API] 🔍 Matched in fields:`, pageNameFields.filter(field => 
          field.toLowerCase().includes(matchedUtilityName.toLowerCase())
        ));
        return false;
      }

      // FILTER 4: Exclude forms from pages with "style-guide" in URL slug (global rule)
      const formPageSlug = form.page?.slug || '';
      if (formPageSlug.toLowerCase().includes('style-guide')) {
        console.log(`[Webflow Forms API] ❌ FILTERED (Style Guide URL slug): "${displayName}" on "${pageName}" (slug: "${formPageSlug}")`);
        return false;
      }

      console.log(`[Webflow Forms API] ✅ KEEPING: "${displayName}" on "${pageName}" (passed all filters)`);
      return true;
    });

    // SMART DEDUPLICATION: Keep only the latest version of each form by name + page
    // This handles cases where forms exist in multiple site domains or were updated
    const uniqueForms = filteredForms.reduce((acc: any[], form: any) => {
      const existingByNameAndPage = acc.find(f => 
        f.displayName === form.displayName && f.pageName === form.pageName
      );

      if (existingByNameAndPage) {
        // Keep the newer form (by creation date)
        const existingDate = new Date(existingByNameAndPage.createdOn);
        const currentDate = new Date(form.createdOn);
        
        if (currentDate > existingDate) {
          console.log(`[Webflow Forms API] 🔄 REPLACING: "${form.displayName}" on "${form.pageName}" (newer version: ${form.createdOn} vs ${existingByNameAndPage.createdOn})`);
          const index = acc.indexOf(existingByNameAndPage);
          acc[index] = form;
        } else {
          console.log(`[Webflow Forms API] 🔄 DUPLICATE REMOVED: "${form.displayName}" on "${form.pageName}" (older version: ${form.createdOn} vs ${existingByNameAndPage.createdOn})`);
        }
        return acc;
      }

      // New unique form
      console.log(`[Webflow Forms API] ✅ KEEPING: "${form.displayName}" on "${form.pageName}" (ID: ${form.id})`);
      acc.push(form);
      return acc;
    }, []);

    console.log(`[Webflow Forms API] 📊 FILTERING SUMMARY:`, {
      original: allForms.length,
      afterFiltering: filteredForms.length,
      afterDeduplication: uniqueForms.length,
      removed: allForms.length - uniqueForms.length,
      keptForms: uniqueForms.map(f => f.displayName || f.name)
    });

    // Log final results for debugging
    console.log(`[Webflow Forms API] ✅ FINAL RESULT: Returning ${uniqueForms.length} forms`);
    uniqueForms.forEach((form, index) => {
      console.log(`[Webflow Forms API] 📋 Final Form ${index + 1}: "${form.displayName || form.name}" on "${form.pageName}"`);
    });

    // Return filtered and deduplicated data
    const filteredData = {
      ...data,
      forms: uniqueForms
    };

    // Return with no-cache headers to prevent browser caching
    return NextResponse.json(filteredData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
