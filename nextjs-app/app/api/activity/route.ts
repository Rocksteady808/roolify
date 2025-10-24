import { NextResponse } from 'next/server';
import { getRecentActivities, getActivitiesForForm } from '../../../lib/activityStore';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');
    const siteId = url.searchParams.get('siteId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    let activities;
    
    if (formId) {
      activities = await getActivitiesForForm(formId, limit);
    } else if (siteId) {
      // Get activities for a specific site
      const allActivities = await getRecentActivities(100);
      
      // Filter activities by siteId (activities now have site_id field)
      activities = allActivities.filter(activity => {
        // If activity has site_id, filter by it
        if (activity.site_id) {
          return activity.site_id === siteId;
        }
        // If no site_id on activity, skip it (legacy activities without site_id)
        return false;
      }).slice(0, limit);
      
      console.log(`[Activity API] Filtered ${activities.length} activities for site ${siteId} from ${allActivities.length} total`);
    } else {
      activities = await getRecentActivities(limit);
    }
    
    return NextResponse.json({ activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}



