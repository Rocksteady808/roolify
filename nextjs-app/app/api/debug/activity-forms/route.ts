import { NextResponse } from 'next/server';
import { getRecentActivities } from '../../../../lib/activityStore';
import { xanoForms } from '../../../../lib/xano';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId parameter required' }, { status: 400 });
    }

    // Get all activities
    const allActivities = getRecentActivities(100);
    
    // Get all forms from Xano
    const allForms = await xanoForms.getAll();
    const siteForms = allForms.filter(f => f.site_id === siteId);
    
    // Create form ID sets
    const siteFormIds = new Set<string>();
    siteForms.forEach(form => {
      siteFormIds.add(form.id.toString()); // Xano numeric ID
      if (form.html_form_id) {
        siteFormIds.add(form.html_form_id); // HTML form ID
      }
    });
    
    // Get unique form IDs from activities
    const activityFormIds = new Set(allActivities.map(a => a.formId).filter(Boolean));
    
    return NextResponse.json({
      siteId,
      totalActivities: allActivities.length,
      totalSiteForms: siteForms.length,
      siteForms: siteForms.map(f => ({
        id: f.id,
        html_form_id: f.html_form_id,
        name: f.name,
        site_id: f.site_id
      })),
      siteFormIds: Array.from(siteFormIds),
      activityFormIds: Array.from(activityFormIds),
      matchingFormIds: Array.from(activityFormIds).filter(id => siteFormIds.has(id)),
      filteredActivities: allActivities.filter(activity => 
        activity.formId && siteFormIds.has(activity.formId)
      ).slice(0, 4)
    });
  } catch (error) {
    console.error('[Debug Activity Forms] Error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}








