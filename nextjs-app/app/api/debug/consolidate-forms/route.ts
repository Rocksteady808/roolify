import { NextResponse } from 'next/server';
import { xanoNotifications } from '@/lib/xano';

/**
 * Consolidate all HBI form notification settings to form 52
 * Form 52 is the one currently receiving submissions
 */
export async function POST() {
  try {
    // Get settings for form 53 (has the correct routing rules)
    const settingsForm53 = await xanoNotifications.getByFormId(53);

    if (!settingsForm53) {
      return NextResponse.json({
        error: 'No settings found for form 53 to copy from'
      }, { status: 404 });
    }

    console.log('[Consolidate] Found settings for form 53:', settingsForm53);

    // Check if settings already exist for form 52
    const existingForm52 = await xanoNotifications.getByFormId(52);

    let result;
    if (existingForm52) {
      // Update existing settings for form 52
      console.log('[Consolidate] Updating existing settings for form 52');
      result = await xanoNotifications.update(existingForm52.id, {
        admin_routes: settingsForm53.admin_routes,
        user_routes: settingsForm53.user_routes,
        admin_fallback_email: settingsForm53.admin_fallback_email,
        user_fallback_email: settingsForm53.user_fallback_email,
        custom_value: settingsForm53.custom_value,
        field_custom_values: settingsForm53.field_custom_values,
        email_template: settingsForm53.email_template,
        admin_subject: settingsForm53.admin_subject,
        user_subject: settingsForm53.user_subject,
        webflow_site_id: "68eb5d6db0e34d2e3ed12c0a", // Use the site ID from form 52
      });
    } else {
      // Create new settings for form 52
      console.log('[Consolidate] Creating new settings for form 52');
      result = await xanoNotifications.create({
        form_id: 52,
        user_id: 1,
        admin_routes: settingsForm53.admin_routes,
        user_routes: settingsForm53.user_routes,
        admin_fallback_email: settingsForm53.admin_fallback_email,
        user_fallback_email: settingsForm53.user_fallback_email,
        custom_value: settingsForm53.custom_value,
        field_custom_values: settingsForm53.field_custom_values,
        email_template: settingsForm53.email_template,
        admin_subject: settingsForm53.admin_subject,
        user_subject: settingsForm53.user_subject,
        webflow_site_id: "68eb5d6db0e34d2e3ed12c0a", // Use the site ID from form 52
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings consolidated to form 52',
      form52Settings: result
    });

  } catch (error: any) {
    console.error('[Consolidate] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to consolidate notification settings to form 52',
    info: 'This will copy settings from form 53 to form 52'
  });
}
