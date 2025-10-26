import { NextRequest, NextResponse } from 'next/server';
import { xanoNotifications, xanoForms, xanoSites } from '@/lib/xano';
import { getCurrentUserId } from '@/lib/serverAuth';

/**
 * ⚠️ NOTIFICATION SETTINGS API ⚠️
 *
 * This API endpoint handles notification settings for forms.
 * It automatically syncs form records if they don't exist.
 *
 * This endpoint:
 * ✅ Syncs form records to Xano if needed (via xanoForms.sync())
 * ✅ Creates/updates notification_setting records with numeric FKs
 * ✅ Uses form.id, user.id, and site.id as foreign keys
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');  // This is html_form_id from Webflow
    const siteId = searchParams.get('siteId');   // This is Webflow site ID

    // Get current user ID for filtering
    const currentUserId = await getCurrentUserId(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (formId && siteId) {
      console.log(`[Notifications API] GET: Loading settings for site="${siteId}", form="${formId}" (user ${currentUserId})`);

      // 1. Find form record by site_id + html_form_id AND user_id
      const allForms = await xanoForms.getAll();
      const form = allForms.find(f => 
        f.html_form_id === formId && f.site_id === siteId && f.user_id === currentUserId
      );
      
      // 2. If form doesn't exist yet, return empty (OK - not saved yet)
      if (!form) {
        console.log(`[Notifications API] No form found for site="${siteId}", form="${formId}" (this is OK)`);
        return NextResponse.json({});
      }
      
      // 3. Query by numeric form.id
      const settings = await xanoNotifications.getByFormId(form.id);

      if (settings) {
        console.log(`[Notifications API] ✅ Settings found (ID: ${settings.id}) for form.id=${form.id}`);
      } else {
        console.log(`[Notifications API] No settings found for form.id=${form.id} (this is OK)`);
      }

      // Return empty object if no settings found (not an error)
      return NextResponse.json(settings || {});
    } else if (formId || siteId) {
      // Missing either formId or siteId
      console.log('[Notifications API] GET: Both formId and siteId are required');
      return NextResponse.json({});
    } else {
      // Get all settings from Xano and filter by current user
      console.log('[Notifications API] GET: Loading notification settings for current user');
      const allSettings = await xanoNotifications.getAll();
      const userSettings = allSettings.filter(s => s.user === currentUserId);
      console.log(`[Notifications API] Found ${userSettings.length} notification settings for user ${currentUserId} from ${allSettings.length} total`);
      return NextResponse.json(userSettings);
    }
  } catch (error) {
    console.error('[Notifications API] Error loading settings:', error);
    return NextResponse.json({ error: 'Failed to load notification settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[Notifications API] 🚀 POST: Saving notification settings');

  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId(req);
    if (!userId) {
      console.error('[Notifications API] ❌ Authentication required');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      formId,            // This is html_form_id from Webflow
      siteId,            // This is Webflow site ID
      formName,          // For logging only
      adminRecipients,
      userRecipients,
      adminRoutes,
      userRoutes,
      emailTemplate,
      adminSubject,
      userSubject,
      customValue,
      fieldCustomValues,
      includePDF,
    } = body;

    if (!siteId || !formId) {
      return NextResponse.json({ error: 'Missing siteId or formId' }, { status: 400 });
    }

    console.log(`[Notifications API] 💾 Saving settings for site="${siteId}", form="${formId}" (${formName})`);
    console.log(`[Notifications API] 📊 Admin routes: ${Array.isArray(adminRoutes) ? adminRoutes.length : 0} rules`);
    console.log(`[Notifications API] 📊 User routes: ${Array.isArray(userRoutes) ? userRoutes.length : 0} rules`);

    // 1. Get numeric site ID from Xano site table
    const site = await xanoSites.getByWebflowSiteId(siteId);
    if (!site?.id) {
      console.error(`[Notifications API] ❌ Site not found for webflow_site_id="${siteId}"`);
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // 2. Find or create form record in Xano
    const formData = {
      html_form_id: formId,
      name: formName,
      site_id: siteId,
      user_id: userId
    };
    const form = await xanoForms.sync(formData);
    console.log(`[Notifications API] ✅ Form synced: id=${form.id}, name="${form.name}"`);

    // 3. Pass numeric FKs to upsert
    const notificationData = {
      form: form.id,      // numeric FK
      user: userId,       // numeric FK
      site: site.id,      // numeric FK
      admin_routes: adminRoutes || [],
      user_routes: userRoutes || [],
      admin_fallback_email: adminRecipients || null,
      user_fallback_email: userRecipients || null,
      custom_value: customValue || null,
      field_custom_values: fieldCustomValues || null,
      email_template: emailTemplate || null,
      admin_subject: adminSubject || null,
      user_subject: userSubject || null,
      include_pdf: includePDF || false,  // Add PDF setting
    };

    // Use upsert to create or update with numeric FKs
    const result = await xanoNotifications.upsert(notificationData);

    console.log(`[Notifications API] ✅ Successfully saved notification settings (ID: ${result.id})`);
    console.log(`[Notifications API] ✅ Saved with form.id=${form.id}, user.id=${userId}, site.id=${site.id}`);

    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('[Notifications API] Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save notification settings' }, { status: 500 });
  }
}
