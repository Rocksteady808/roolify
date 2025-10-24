import { NextRequest, NextResponse } from 'next/server';
import { xanoNotifications, xanoForms } from '@/lib/xano';

/**
 * Debug endpoint to test notification routing without submitting a form
 * GET /api/debug/notifications/[formId]?testData={...}
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;
    const { searchParams } = new URL(req.url);
    const testDataParam = searchParams.get('testData');
    
    console.log('[Debug Notifications] 🔍 Testing notification routing for form:', formId);
    
    // Parse test data if provided
    let testData = {};
    if (testDataParam) {
      try {
        testData = JSON.parse(decodeURIComponent(testDataParam));
        console.log('[Debug Notifications] 📄 Test data:', testData);
      } catch (e) {
        return NextResponse.json({
          error: 'Invalid testData parameter. Must be valid JSON.',
          example: '/api/debug/notifications/123?testData=' + encodeURIComponent('{"country":"USA","name":"John"}')
        }, { status: 400 });
      }
    }

    // Get form details
    let form;
    try {
      form = await xanoForms.getById(parseInt(formId));
      console.log('[Debug Notifications] 📋 Form found:', form.name);
    } catch (error) {
      return NextResponse.json({
        error: 'Form not found',
        formId: formId
      }, { status: 404 });
    }

    // Get notification settings
    const settings = await xanoNotifications.getByFormId(parseInt(formId));
    if (!settings) {
      return NextResponse.json({
        error: 'No notification settings found for this form',
        formId: formId,
        formName: form.name,
        suggestion: 'Create notification settings at /notifications/' + formId
      }, { status: 404 });
    }

    console.log('[Debug Notifications] ⚙️ Notification settings found');

    // Parse admin routes
    let parsedAdminRoutes = settings.admin_routes;
    if (typeof settings.admin_routes === 'string') {
      try {
        parsedAdminRoutes = JSON.parse(settings.admin_routes);
      } catch (e) {
        return NextResponse.json({
          error: 'Invalid admin_routes JSON in notification settings',
          formId: formId
        }, { status: 500 });
      }
    }

    // Test field matching logic
    const normalizeFieldName = (name: string) => {
      return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[-_\s]/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    const routeTests = [];
    const adminEmails = new Set<string>();

    if (parsedAdminRoutes && Array.isArray(parsedAdminRoutes)) {
      for (const route of parsedAdminRoutes) {
        const routeTest = {
          route: route,
          fieldLookup: {},
          matchResult: false,
          emailSent: false
        };

        // Test direct field lookup
        let fieldValue = (testData[route.field] ?? '').toString().trim();
        routeTest.fieldLookup.direct = {
          field: route.field,
          value: fieldValue,
          found: !!fieldValue
        };

        // Test normalized field lookup
        if (!fieldValue) {
          const normalizedRouteField = normalizeFieldName(route.field);
          const matchingKey = Object.keys(testData).find(key => {
            const normalizedKey = normalizeFieldName(key);
            return normalizedKey === normalizedRouteField;
          });

          if (matchingKey) {
            fieldValue = (testData[matchingKey] ?? '').toString().trim();
            routeTest.fieldLookup.normalized = {
              routeField: route.field,
              normalizedRouteField: normalizedRouteField,
              matchingKey: matchingKey,
              value: fieldValue,
              found: true
            };
          } else {
            routeTest.fieldLookup.normalized = {
              routeField: route.field,
              normalizedRouteField: normalizedRouteField,
              availableFields: Object.keys(testData),
              found: false
            };
          }
        }

        // Test condition matching
        const conditionValue = (route.value ?? '').toString().trim();
        let matches = false;
        switch (route.operator) {
          case 'equals':
            matches = String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
            break;
          case 'contains':
            matches = String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
            break;
          case 'starts_with':
            matches = String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
            break;
          case 'ends_with':
            matches = String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
            break;
        }

        routeTest.matchResult = matches;
        if (matches && route.recipients) {
          routeTest.emailSent = true;
          route.recipients.split(',').forEach((email: string) => adminEmails.add(email.trim()));
        }

        routeTests.push(routeTest);
      }
    }

    // Test fallback
    let fallbackUsed = false;
    if (adminEmails.size === 0 && settings.admin_fallback_email) {
      fallbackUsed = true;
      settings.admin_fallback_email.split(',').forEach(email => adminEmails.add(email.trim()));
    }

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        name: form.name,
        html_form_id: form.html_form_id
      },
      testData: testData,
      notificationSettings: {
        id: settings.id,
        hasAdminRoutes: !!(parsedAdminRoutes && parsedAdminRoutes.length > 0),
        adminRoutesCount: parsedAdminRoutes?.length || 0,
        hasFallbackEmail: !!settings.admin_fallback_email,
        fallbackEmail: settings.admin_fallback_email
      },
      routeTests: routeTests,
      result: {
        emailsToSend: Array.from(adminEmails),
        emailCount: adminEmails.size,
        fallbackUsed: fallbackUsed,
        willSendEmail: adminEmails.size > 0
      },
      suggestions: adminEmails.size === 0 ? [
        'No emails will be sent. Check:',
        '1. Field names in routes match test data keys',
        '2. Route values match test data values',
        '3. Route operators are correct',
        '4. Recipients are specified in routes',
        '5. Fallback email is configured'
      ] : []
    });

  } catch (error) {
    console.error('[Debug Notifications] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST endpoint to test with custom data
 * POST /api/debug/notifications/[formId]
 * Body: { testData: { field1: "value1", field2: "value2" } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;
    const body = await req.json();
    const { testData = {} } = body;
    
    console.log('[Debug Notifications] 🔍 POST: Testing with custom data');
    
    // Convert POST data to GET URL and call GET handler
    const testDataParam = encodeURIComponent(JSON.stringify(testData));
    const mockUrl = new URL(req.url);
    mockUrl.searchParams.set('testData', testDataParam);
    
    const mockReq = new Request(mockUrl.toString(), {
      method: 'GET',
      headers: req.headers
    });
    
    return GET(mockReq, { params });
    
  } catch (error) {
    console.error('[Debug Notifications] POST Error:', error);
    return NextResponse.json({
      error: 'Invalid request body',
      expectedFormat: { testData: { field1: "value1", field2: "value2" } }
    }, { status: 400 });
  }
}
