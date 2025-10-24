import { NextRequest, NextResponse } from 'next/server';
import { xanoNotifications, xanoForms } from '@/lib/xano';

/**
 * Debug endpoint to show all forms for a specific site
 * GET /api/debug/form-ids/[siteId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    
    console.log('[Debug Form IDs] 🔍 Analyzing forms for site:', siteId);
    
    // Get all forms for this site
    const allForms = await xanoForms.getAll();
    const siteForms = allForms.filter(f => f.site_id === siteId);
    
    console.log(`[Debug Form IDs] Found ${siteForms.length} forms for site ${siteId}`);
    
    // Get all notification settings
    const allSettings = await xanoNotifications.getAll();
    
    // Check for potential duplicates (same name)
    const formsByName: Record<string, any[]> = {};
    siteForms.forEach(form => {
      if (!formsByName[form.name]) {
        formsByName[form.name] = [];
      }
      formsByName[form.name].push(form);
    });
    
    const duplicates = Object.entries(formsByName)
      .filter(([name, forms]) => forms.length > 1)
      .map(([name, forms]) => ({
        name,
        count: forms.length,
        forms: forms.map(f => ({
          id: f.id,
          html_form_id: f.html_form_id,
          created_at: f.created_at,
          hasNotifications: allSettings.some(s => s.form === f.id)
        }))
      }));
    
    // Analyze each form
    const analyzedForms = siteForms.map(f => ({
      id: f.id,
      name: f.name,
      html_form_id: f.html_form_id,
      created_at: f.created_at,
      hasNotifications: allSettings.some(s => s.form === f.id),
      notificationSettings: allSettings.find(s => s.form === f.id) ? {
        id: allSettings.find(s => s.form === f.id)!.id,
        adminRoutesCount: Array.isArray(allSettings.find(s => s.form === f.id)!.admin_routes) 
          ? allSettings.find(s => s.form === f.id)!.admin_routes.length 
          : 0,
        hasFallbackEmail: !!allSettings.find(s => s.form === f.id)!.admin_fallback_email,
        fallbackEmail: allSettings.find(s => s.form === f.id)!.admin_fallback_email
      } : null
    }));
    
    // Generate recommendations
    const recommendations = [];
    
    if (duplicates.length > 0) {
      recommendations.push(`⚠️ You have ${duplicates.length} form(s) with duplicate names. This can cause confusion when configuring notifications.`);
    }
    
    const formsWithoutHtmlId = siteForms.filter(f => !f.html_form_id);
    if (formsWithoutHtmlId.length > 0) {
      recommendations.push(`⚠️ ${formsWithoutHtmlId.length} form(s) missing html_form_id. These won't work with form submissions.`);
    }
    
    const formsWithoutNotifications = siteForms.filter(f => !allSettings.some(s => s.form === f.id));
    if (formsWithoutNotifications.length > 0) {
      recommendations.push(`💡 ${formsWithoutNotifications.length} form(s) have no notification settings configured.`);
    }
    
    const htmlIdFormats = [...new Set(siteForms.map(f => f.html_form_id).filter(Boolean))];
    const hasMultipleFormats = htmlIdFormats.some(id => id.startsWith('wf-form-')) && 
                               htmlIdFormats.some(id => !id.startsWith('wf-form-') && id.length > 10);
    if (hasMultipleFormats) {
      recommendations.push(`🔍 Forms use different html_form_id formats. Make sure notification settings use the same format as form submissions.`);
    }
    
    const result = {
      siteId,
      summary: {
        totalForms: siteForms.length,
        formsWithNotifications: siteForms.filter(f => allSettings.some(s => s.form === f.id)).length,
        duplicateNames: duplicates.length,
        formsWithoutHtmlId: formsWithoutHtmlId.length,
        htmlIdFormats: htmlIdFormats.length
      },
      forms: analyzedForms,
      duplicates: duplicates,
      htmlIdFormats: htmlIdFormats,
      recommendations: recommendations,
      troubleshooting: {
        note: "When configuring notifications, ensure the html_form_id matches what form submissions will send.",
        checkSubmissionLogs: "Submit a form and check server logs for the htmlFormId being used.",
        verifyAssociation: "Use this endpoint to verify notification settings are on the correct form."
      }
    };
    
    console.log(`[Debug Form IDs] Analysis complete:`, {
      totalForms: siteForms.length,
      duplicates: duplicates.length,
      recommendations: recommendations.length
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Debug Form IDs] Error:', error);
    return NextResponse.json({
      error: 'Failed to analyze forms',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
