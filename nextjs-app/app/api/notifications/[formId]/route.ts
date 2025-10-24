import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';

// Use the same Xano URL as the main lib/xano.ts for consistency
const MAIN_BASE_URL = process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

/**
 * GET /api/notifications/[formId]
 * Retrieve notification settings for a specific form using site_id + html_form_id
 *
 * Required query param: ?siteId=xxx
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;  // This is html_form_id from Webflow
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      logger.error('siteId query parameter is required');
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 }
      );
    }

    logger.debug(`Fetching notification settings for site=${siteId}, form=${formId}`);

    // Query by site_id + html_form_id directly
    const { xanoNotifications } = await import('@/lib/xano');
    const settings = await xanoNotifications.getBySiteAndForm(siteId, formId);

    if (!settings) {
      logger.debug(`No notification settings found for site=${siteId}, form=${formId}`);
      return NextResponse.json(
        {
          settings: null,
          form: {
            html_form_id: formId,
            site_id: siteId,
          }
        },
        { status: 200 }
      );
    }

    // Parse JSON fields
    let adminRoutes = [];
    let userRoutes = [];

    try {
      adminRoutes = typeof settings.admin_routes === 'string'
        ? JSON.parse(settings.admin_routes)
        : settings.admin_routes || [];
    } catch (e) {
      logger.error('Failed to parse admin routes', e);
    }

    try {
      userRoutes = typeof settings.user_routes === 'string'
        ? JSON.parse(settings.user_routes)
        : settings.user_routes || [];
    } catch (e) {
      logger.error('Failed to parse user routes', e);
    }

    logger.debug(`Found notification settings (ID: ${settings.id})`);

    return NextResponse.json({
      settings: {
        id: settings.id,
        site_id: settings.site_id,
        html_form_id: settings.html_form_id,
        admin_routes: adminRoutes,
        user_routes: userRoutes,
        admin_fallback_email: settings.admin_fallback_email || '',
        user_fallback_email: settings.user_fallback_email || '',
        custom_value: settings.custom_value || null,
        field_custom_values: settings.field_custom_values || null,
        email_template: settings.email_template || null,
        admin_subject: settings.admin_subject || null,
        user_subject: settings.user_subject || null,
      },
      form: {
        html_form_id: formId,
        site_id: siteId,
      }
    });
  } catch (error) {
    logger.error('Error fetching notification settings', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT - Update notification settings for a form
export async function PUT(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;  // This is html_form_id
    const body = await req.json();
    const {
      siteId,
      admin_routes,
      user_routes,
      admin_fallback_email,
      user_fallback_email,
      custom_value,
      field_custom_values,
      email_template,
      admin_subject,
      user_subject
    } = body;

    if (!siteId) {
      logger.error('siteId is required in request body');
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    logger.debug(`Updating notification settings for site=${siteId}, form=${formId}`);

    // Use upsert to create or update settings
    const { xanoNotifications } = await import('@/lib/xano');

    const data = {
      site_id: siteId,
      html_form_id: formId,
      user_id: 1, // TODO: Get from auth
      admin_routes,
      user_routes,
      admin_fallback_email,
      user_fallback_email,
      custom_value,
      field_custom_values,
      email_template,
      admin_subject,
      user_subject,
    };

    const result = await xanoNotifications.upsert(data);
    logger.debug(`Updated notification settings (ID: ${result.id})`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error('Error updating notification settings', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

