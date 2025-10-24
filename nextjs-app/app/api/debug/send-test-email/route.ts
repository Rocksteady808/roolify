import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to send a test email
 * Usage: POST /api/debug/send-test-email
 * Body: { "to": "your@email.com", "formName": "Test Form" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, formName = 'Test Form', includeTestData = true } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" email address in request body' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Check SendGrid configuration
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      return NextResponse.json(
        {
          error: 'SendGrid not configured',
          hint: 'Add SENDGRID_API_KEY to your environment variables',
          docs: 'Get your API key from: https://app.sendgrid.com/settings/api_keys'
        },
        { status: 500 }
      );
    }

    // Generate test form data
    const testFormData = includeTestData ? {
      'First Name': 'Test',
      'Last Name': 'User',
      'Email': to,
      'Message': 'This is a test submission from the debug endpoint',
      'Country': 'United States',
      'Terms Accepted': 'true',
      '_htmlFormId': 'test-form',
      '_formName': formName,
      '_siteId': 'test-site',
      '_timestamp': new Date().toISOString()
    } : {
      '_htmlFormId': 'test-form',
      '_formName': formName,
      '_siteId': 'test-site',
      '_timestamp': new Date().toISOString()
    };

    // Generate test email HTML
    const emailHTML = generateTestEmailHTML(testFormData, formName);

    // Send via SendGrid
    console.log('[Test Email] Sending test email to:', to);

    const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: `🧪 Test Email from ${formName}`
        }
      ],
      from: {
        email: 'aaront@flexflowweb.com',
        name: 'FlexFlow Test'
      },
      content: [
        {
          type: 'text/html',
          value: emailHTML
        }
      ],
      mail_settings: {
        sandbox_mode: {
          enable: false
        }
      }
    };

    const response = await fetch(sendGridUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[Test Email] SendGrid error:', {
        status: response.status,
        response: responseText
      });

      return NextResponse.json(
        {
          success: false,
          error: 'SendGrid API error',
          status: response.status,
          details: responseText,
          hint: response.status === 401 ? 'Invalid SendGrid API key' : response.status === 403 ? 'Sender email not verified in SendGrid' : 'Check SendGrid dashboard for details'
        },
        { status: response.status }
      );
    }

    console.log('[Test Email] ✅ Test email sent successfully to:', to);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      sentTo: to,
      subject: `🧪 Test Email from ${formName}`,
      sendgrid: {
        status: response.status,
        statusText: response.statusText
      },
      nextSteps: [
        '1. Check your inbox (and spam folder)',
        '2. If you received it: SendGrid is working correctly',
        '3. If not received: Check SendGrid Activity Feed for details',
        '4. SendGrid Activity Feed: https://app.sendgrid.com/email_activity'
      ]
    });

  } catch (error) {
    console.error('[Test Email] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Generate test email HTML
 */
function generateTestEmailHTML(formData: any, formName: string): string {
  const entries = Object.entries(formData)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => {
      const label = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const displayValue = String(value || '');

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 30%;">
            ${label}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${displayValue}
          </td>
        </tr>
      `;
    }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🧪 Test Email - ${formName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background-color: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
              🧪 Test Email
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
                ✅ SUCCESS! Email notifications are working correctly.
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              This is a test email sent from the debug endpoint to verify that your email notification system is configured correctly.
            </p>

            ${entries ? `
            <h2 style="color: #374151; font-size: 18px; margin-top: 24px; margin-bottom: 12px;">Test Form Data:</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${entries}
            </table>
            ` : ''}

            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                Email Configuration Details:
              </p>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                Sent: ${new Date().toLocaleString()}<br>
                From: aaront@flexflowweb.com<br>
                Method: SendGrid Direct API<br>
                Form: ${formName}
              </p>
            </div>

            <div style="margin-top: 24px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
                📝 Next Steps:
              </p>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                <li>If you received this email, SendGrid is working correctly ✅</li>
                <li>Configure notification settings for your forms in the dashboard</li>
                <li>Test with a real form submission</li>
                <li>Check spam folder if emails don't arrive</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This is a test email from FlexFlow Web Form Notifications Debug System
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}

/**
 * GET endpoint to show usage instructions
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/debug/send-test-email',
    method: 'POST',
    description: 'Send a test email to verify SendGrid configuration',
    usage: {
      url: '/api/debug/send-test-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        to: 'your@email.com',
        formName: 'Test Form (optional)',
        includeTestData: true
      }
    },
    example: `
curl -X POST http://localhost:1337/api/debug/send-test-email \\
  -H "Content-Type: application/json" \\
  -d '{"to": "your@email.com", "formName": "My Test Form"}'
    `.trim()
  });
}
