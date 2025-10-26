import { NextResponse } from 'next/server';
import { getRecentActivities, getActivitiesForForm } from '../../../lib/activityStore';
import { getCurrentUserId } from '../../../lib/serverAuth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');
    const siteId = url.searchParams.get('siteId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Get current user ID for filtering
    const currentUserId = await getCurrentUserId(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    let activities;
    
    if (formId) {
      activities = await getActivitiesForForm(formId, limit);
    } else if (siteId) {
      // Get activities for a specific site
      const allActivities = await getRecentActivities(100);
      
      // Filter activities by BOTH siteId AND user_id
      activities = allActivities.filter(activity => {
        // STRICT: Must have user_id AND it must match current user
        if (!activity.user_id || activity.user_id !== currentUserId) {
          return false; // Exclude activities without user_id OR with wrong user_id
        }
        
        // Must belong to current site
        if (activity.site_id) {
          return activity.site_id === siteId;
        }
        
        // Skip activities without site_id
        return false;
      }).slice(0, limit);
      
      console.log(`[Activity API] Filtered ${activities.length} activities for user ${currentUserId}, site ${siteId} from ${allActivities.length} total`);
    } else {
      // Get all activities for current user only
      const allActivities = await getRecentActivities(100);
      activities = allActivities.filter(activity => 
        activity.user_id && activity.user_id === currentUserId
      ).slice(0, limit);
    }
    
    return NextResponse.json({ activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}



