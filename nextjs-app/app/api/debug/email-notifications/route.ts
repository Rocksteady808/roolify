import { NextRequest, NextResponse } from 'next/server';
import { xanoNotifications, xanoForms } from '@/lib/xano';

/**
 * Debug endpoint to check notification configuration for a form
 * Usage: /api/debug/email-notifications?formId=123
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json(
        { error: 'Missing formId parameter. Usage: /api/debug/email-notifications?formId=YOUR_FORM_ID' },
        { status: 400 }
      );
    }

    // Check if formId is numeric (Xano ID) or string (HTML form ID)
    let numericFormId: number;
    let formInfo: any = null;

    if (/^\d+$/.test(formId)) {
      // Already numeric
      numericFormId = parseInt(formId);
      formInfo = await xanoForms.getById(numericFormId);
    } else {
      // HTML form ID - need to look it up
      const allForms = await xanoForms.getAll();
      const matchedForm = allForms.find(f => f.html_form_id === formId);

      if (!matchedForm) {
        return NextResponse.json({
          error: 'Form not found in Xano',
          formId,
          hint: 'This HTML form ID does not exist in the forms table',
          availableForms: allForms.map(f => ({
            id: f.id,
            html_form_id: f.html_form_id,
            name: f.name
          }))
        }, { status: 404 });
      }

      numericFormId = matchedForm.id;
      formInfo = matchedForm;
    }

    // Get notification settings
    const settings = await xanoNotifications.getByFormId(numericFormId);

    // Parse JSON fields if they're strings
    let adminRoutes = [];
    let userRoutes = [];
    let fieldCustomValues = null;

    if (settings) {
      if (typeof settings.admin_routes === 'string') {
        try {
          adminRoutes = JSON.parse(settings.admin_routes);
        } catch (e) {
          adminRoutes = [];
        }
      } else {
        adminRoutes = settings.admin_routes || [];
      }

      if (typeof settings.user_routes === 'string') {
        try {
          userRoutes = JSON.parse(settings.user_routes);
        } catch (e) {
          userRoutes = [];
        }
      } else {
        userRoutes = settings.user_routes || [];
      }

      if (settings.field_custom_values) {
        if (typeof settings.field_custom_values === 'string') {
          try {
            fieldCustomValues = JSON.parse(settings.field_custom_values);
          } catch (e) {
            fieldCustomValues = null;
          }
        } else {
          fieldCustomValues = settings.field_custom_values;
        }
      }
    }

    // Check SendGrid configuration
    const sendgridConfigured = !!process.env.SENDGRID_API_KEY;

    // Build comprehensive response
    const response: any = {
      formId: formId,
      numericFormId: numericFormId,
      formInfo: formInfo ? {
        id: formInfo.id,
        name: formInfo.name,
        html_form_id: formInfo.html_form_id,
        site_id: formInfo.site_id,
        user_id: formInfo.user_id
      } : null,
      notificationSettings: settings ? {
        id: settings.id,
        admin_fallback_email: settings.admin_fallback_email || '❌ NOT SET',
        user_fallback_email: settings.user_fallback_email || '❌ NOT SET',
        admin_subject: settings.admin_subject || 'Default subject',
        user_subject: settings.user_subject || 'Default subject',
        has_custom_template: !!settings.email_template,
        custom_value: settings.custom_value || null,
        field_custom_values: fieldCustomValues,
        webflow_site_id: settings.webflow_site_id || 'Not set',
        admin_routes_count: adminRoutes.length,
        user_routes_count: userRoutes.length,
        admin_routes: adminRoutes,
        user_routes: userRoutes
      } : '❌ NO NOTIFICATION SETTINGS CONFIGURED FOR THIS FORM',
      sendgrid: {
        configured: sendgridConfigured,
        status: sendgridConfigured ? '✅ API key is set' : '❌ SENDGRID_API_KEY not found in environment',
        from_email: 'aaront@flexflowweb.com'
      },
      diagnosis: []
    };

    // Add diagnostic messages
    if (!settings) {
      response.diagnosis.push('❌ PROBLEM: No notification settings found. Go to /notifications and configure email settings for this form.');
    } else {
      if (!settings.admin_fallback_email && adminRoutes.length === 0) {
        response.diagnosis.push('⚠️ WARNING: No admin fallback email AND no routing rules configured. Emails will NOT be sent.');
      } else if (settings.admin_fallback_email) {
        response.diagnosis.push(`✅ Fallback email configured: ${settings.admin_fallback_email}`);
      }

      if (adminRoutes.length > 0) {
        response.diagnosis.push(`✅ ${adminRoutes.length} conditional routing rule(s) configured`);
        adminRoutes.forEach((route: any, index: number) => {
          response.diagnosis.push(`   Route ${index + 1}: If "${route.field}" ${route.operator} "${route.value}" → send to ${route.recipients}`);
        });
      }
    }

    if (!sendgridConfigured) {
      response.diagnosis.push('❌ CRITICAL: SendGrid API key not configured. Emails cannot be sent.');
    } else {
      response.diagnosis.push('✅ SendGrid is configured');
    }

    // Add helpful next steps
    response.nextSteps = [];
    if (!settings) {
      response.nextSteps.push('1. Go to /notifications page');
      response.nextSteps.push('2. Select this form');
      response.nextSteps.push('3. Configure at least one of: fallback email OR routing rules');
      response.nextSteps.push('4. Click "Save Settings"');
    } else if (!settings.admin_fallback_email && adminRoutes.length === 0) {
      response.nextSteps.push('1. Go to /notifications page');
      response.nextSteps.push('2. Either set a fallback email OR add routing rules');
      response.nextSteps.push('3. Click "Save Settings"');
    } else {
      response.nextSteps.push('✅ Configuration looks good!');
      response.nextSteps.push('Test by submitting the form or using /api/debug/send-test-email');
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('[Debug Email Notifications] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check notification settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
