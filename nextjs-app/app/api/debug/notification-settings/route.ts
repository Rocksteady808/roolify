import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check notification settings
 * GET /api/debug/notification-settings?formId=<formId>
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');

    if (!formId) {
      return NextResponse.json({ error: 'formId required' }, { status: 400 });
    }

    // Load notification settings from Xano
    const { xanoNotifications } = await import('@/lib/xano');

    // Try to get by form ID
    const settings = await xanoNotifications.getByFormId(parseInt(formId));

    console.log('[Debug] Looking for notification settings for form:', formId);
    console.log('[Debug] Found settings:', settings);

    if (!settings) {
      // Show all available settings
      const allSettings = await xanoNotifications.getAll();

      return NextResponse.json({
        error: 'No settings found for this form',
        requestedFormId: formId,
        availableSettings: allSettings.map(s => ({
          id: s.id,
          form: s.form,
          hasCustomValue: !!s.custom_value,
          hasFieldCustomValues: !!s.field_custom_values,
          custom_value: s.custom_value,
          field_custom_values: s.field_custom_values,
        }))
      });
    }

    // Return raw settings
    return NextResponse.json({
      formId,
      settings: {
        id: settings.id,
        form: settings.form,
        custom_value: settings.custom_value,
        field_custom_values: settings.field_custom_values,
        email_template: settings.email_template,
        admin_routes: settings.admin_routes,
        user_routes: settings.user_routes,
        admin_fallback_email: settings.admin_fallback_email,
        user_fallback_email: settings.user_fallback_email,
      },
      parsed: {
        hasCustomValue: !!settings.custom_value,
        customValueLength: settings.custom_value?.length || 0,
        hasFieldCustomValues: !!settings.field_custom_values,
        fieldCustomValuesType: typeof settings.field_custom_values,
        fieldCustomValuesKeys: settings.field_custom_values
          ? Object.keys(
              typeof settings.field_custom_values === 'string'
                ? JSON.parse(settings.field_custom_values)
                : settings.field_custom_values
            )
          : [],
      }
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
