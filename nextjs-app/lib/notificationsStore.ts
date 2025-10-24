import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const NOTIFICATIONS_FILE = join(process.cwd(), 'notifications.json');

export interface NotificationRoute {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
  recipients: string; // Comma-separated emails
}

export interface NotificationSettings {
  id: string;
  formId: string; // HTML form ID (e.g., "wf-form-Country-Form")
  siteId: string;
  formName: string;
  adminRoutes: NotificationRoute[];
  userRoutes: NotificationRoute[];
  adminFallbackEmail: string | null;
  userFallbackEmail: string | null;
  emailTemplate?: string | null; // Custom HTML template with {{variable}} placeholders
  adminSubject?: string | null;
  userSubject?: string | null;
  customValue?: string | null; // Custom value for field replacements
  createdAt: string;
  updatedAt: string;
}

// Load all notification settings
export function loadNotifications(): NotificationSettings[] {
  try {
    const data = readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    const notifications = JSON.parse(data);
    console.log(`Loaded ${notifications.length} notification settings from file`);
    return notifications;
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

// Save all notification settings
export function saveNotifications(notifications: NotificationSettings[]): void {
  try {
    writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
    console.log(`Saved ${notifications.length} notification settings to file`);
  } catch (error) {
    console.error('Error saving notifications:', error);
    throw error;
  }
}

// Get notification settings for a specific form
export function getNotificationsByFormId(formId: string): NotificationSettings | null {
  const notifications = loadNotifications();
  return notifications.find(n => n.formId === formId) || null;
}

// Create or update notification settings
export function upsertNotification(settings: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>): NotificationSettings {
  const notifications = loadNotifications();
  const existingIndex = notifications.findIndex(n => n.formId === settings.formId && n.siteId === settings.siteId);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    // Update existing
    const existing = notifications[existingIndex];
    notifications[existingIndex] = {
      ...existing,
      ...settings,
      updatedAt: now,
    };
    saveNotifications(notifications);
    console.log(`Updated notification settings for form: ${settings.formId}`);
    return notifications[existingIndex];
  } else {
    // Create new
    const newSettings: NotificationSettings = {
      ...settings,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    notifications.push(newSettings);
    saveNotifications(notifications);
    console.log(`Created notification settings for form: ${settings.formId}`);
    return newSettings;
  }
}

// Delete notification settings
export function deleteNotification(formId: string, siteId: string): boolean {
  const notifications = loadNotifications();
  const filteredNotifications = notifications.filter(
    n => !(n.formId === formId && n.siteId === siteId)
  );
  
  if (filteredNotifications.length < notifications.length) {
    saveNotifications(filteredNotifications);
    console.log(`Deleted notification settings for form: ${formId}`);
    return true;
  }
  
  return false;
}


