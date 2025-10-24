import { xanoActivities, Activity as XanoActivity } from './xano';

// Export the Xano Activity type for consistency
export type Activity = XanoActivity;
export type ActivityType = XanoActivity['type'];

export async function logActivity(activity: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
  try {
    return await xanoActivities.create(activity);
  } catch (error) {
    console.error('Failed to log activity to Xano:', error);
    throw error;
  }
}

export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  try {
    const activities = await xanoActivities.getAll();
    return activities
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get recent activities from Xano:', error);
    return [];
  }
}

export async function getActivitiesForForm(formId: string, limit: number = 10): Promise<Activity[]> {
  try {
    return await xanoActivities.getByFormId(formId, limit);
  } catch (error) {
    console.error('Failed to get activities for form from Xano:', error);
    return [];
  }
}

export async function clearActivities(): Promise<void> {
  try {
    // Get all activities and delete them
    const activities = await xanoActivities.getAll();
    await Promise.all(activities.map(activity => {
      if (activity.id) {
        return xanoActivities.delete(activity.id);
      }
      return Promise.resolve();
    }));
  } catch (error) {
    console.error('Failed to clear activities from Xano:', error);
  }
}



