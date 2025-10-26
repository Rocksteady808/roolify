import { NextResponse } from 'next/server';
import { getRecentActivities } from '../../../../lib/activityStore';
import { getCurrentUserId } from '../../../../lib/serverAuth';

export async function GET(req: Request) {
  try {
    const currentUserId = await getCurrentUserId(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get all activities for debugging
    const allActivities = await getRecentActivities(100);
    
    // Analyze activities
    const analysis = {
      totalActivities: allActivities.length,
      currentUserId,
      activitiesByUser: {} as Record<string, number>,
      activitiesWithoutUserId: 0,
      activitiesWithUserId: 0,
      currentUserActivities: 0,
      sampleActivities: allActivities.slice(0, 5).map(activity => ({
        id: activity.id,
        type: activity.type,
        rule_name: activity.rule_name,
        user_id: activity.user_id,
        site_id: activity.site_id,
        has_user_id: !!activity.user_id,
        has_site_id: !!activity.site_id
      }))
    };

    // Analyze each activity
    allActivities.forEach(activity => {
      if (activity.user_id) {
        analysis.activitiesWithUserId++;
        const userId = activity.user_id.toString();
        analysis.activitiesByUser[userId] = (analysis.activitiesByUser[userId] || 0) + 1;
        
        if (activity.user_id === currentUserId) {
          analysis.currentUserActivities++;
        }
      } else {
        analysis.activitiesWithoutUserId++;
      }
    });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Error analyzing activities:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
