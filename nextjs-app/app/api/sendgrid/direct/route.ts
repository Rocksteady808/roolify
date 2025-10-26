import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct SendGrid API integration
 * Bypasses the broken Xano SendGrid wrapper
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, htmlBody, textBody, fromEmail, fromName, attachments } = body;

    console.log('[Direct SendGrid] Sending email:', {
      to,
      subject,
      fromEmail: fromEmail || 'noreply@yourdomain.com',
      fromName: fromName || 'Form Notifications',
      htmlLength: htmlBody?.length || 0,
      textLength: textBody?.length || 0,
      attachmentCount: attachments?.length || 0
    });

    // SendGrid API endpoint
    const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';
    
    // You'll need to add your SendGrid API key to environment variables
    const apiKey = process.env.SENDGRID_API_KEY;
    
    // Add diagnostic logging
    console.log('[Direct SendGrid] 🔍 DIAGNOSTIC: Checking environment variables');
    console.log('[Direct SendGrid] 🔍 API key exists:', !!apiKey);
    console.log('[Direct SendGrid] 🔍 API key length:', apiKey?.length || 0);
    console.log('[Direct SendGrid] 🔍 API key prefix:', apiKey?.substring(0, 5) || 'NOT_SET');
    console.log('[Direct SendGrid] 🔍 All env vars available:', Object.keys(process.env).filter(k => k.includes('SENDGRID')));
    
    if (!apiKey) {
      console.error('[Direct SendGrid] ❌ Missing SENDGRID_API_KEY environment variable');
      console.error('[Direct SendGrid] 💡 Add SENDGRID_API_KEY to your .env.local file');
      console.error('[Direct SendGrid] 💡 Get your API key from: https://app.sendgrid.com/settings/api_keys');
      return NextResponse.json(
        {
          error: 'SendGrid API key not configured',
          hint: 'Add SENDGRID_API_KEY to your environment variables'
        },
        { status: 500 }
      );
    }

    // Prepare SendGrid API payload with anti-spam headers
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
          // Add custom headers for better deliverability
          custom_args: {
            source: 'form_notifications',
            form_type: 'webflow_form',
            timestamp: new Date().toISOString()
          }
        }
      ],
      from: {
        email: fromEmail || 'aaront@flexflowweb.com',
        name: fromName || 'Form Notifications'
      },
      reply_to: {
        email: fromEmail || 'aaront@flexflowweb.com',
        name: fromName || 'Form Notifications'
      },
      content: [
        {
          type: 'text/html',
          value: htmlBody
        }
      ],
      // Add important headers for deliverability
      headers: {
        'X-Mailer': 'FlexFlow Web Form Notifications',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:${fromEmail || 'aaront@flexflowweb.com'}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Campaign-ID': 'form-notifications',
        'X-Entity-Ref-ID': `form-${Date.now()}`
      },
      // Add tracking settings for better reputation
      tracking_settings: {
        click_tracking: {
          enable: false // Disable for privacy
        },
        open_tracking: {
          enable: false // Disable for privacy
        },
        subscription_tracking: {
          enable: false // Disable for privacy
        }
      },
      // Add spam check
      mail_settings: {
        spam_check: {
          enable: false, // Disable spam check to avoid URL requirement
          threshold: 1
        },
        sandbox_mode: {
          enable: false // Make sure this is false for production
        }
      },
      // Add attachments if provided
      attachments: attachments || []
    };

    // Add plain text content if provided
    if (textBody) {
      emailPayload.content.unshift({
        type: 'text/plain',
        value: textBody
      });
    }

    console.log('[Direct SendGrid] Sending to SendGrid API:', {
      url: sendGridUrl,
      to,
      subject,
      contentTypes: emailPayload.content.map(c => c.type)
    });

    const response = await fetch(sendGridUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[Direct SendGrid] ❌ DIAGNOSTIC: SendGrid API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        requestDetails: {
          to: to,
          subject: subject,
          fromEmail: fromEmail || 'aaront@flexflowweb.com',
          fromName: fromName || 'Form Notifications',
          htmlLength: htmlBody?.length || 0
        }
      });
      
      // Try to parse SendGrid error response for better error messages
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          errorDetails = errorJson.errors.map((err: any) => err.message).join('; ');
        }
      } catch (e) {
        // Keep original responseText if not JSON
      }
      
      console.error('[Direct SendGrid] ❌ DIAGNOSTIC: Parsed error details:', errorDetails);
      
      return NextResponse.json(
        { 
          error: 'SendGrid API error',
          status: response.status,
          statusText: response.statusText,
          details: errorDetails,
          troubleshooting: {
            checkSenderVerification: 'Verify sender email domain in SendGrid',
            checkAPIKey: 'Ensure SENDGRID_API_KEY is valid and has Mail Send permissions',
            checkEmailFormat: 'Verify recipient email format is valid',
            checkRateLimits: 'Check SendGrid account for rate limiting'
          }
        },
        { status: response.status }
      );
    }

    console.log('[Direct SendGrid] Email sent successfully:', {
      to,
      subject,
      status: response.status
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully via SendGrid',
      email: {
        to,
        subject,
        sent: true,
        method: 'direct_sendgrid'
      }
    });

  } catch (error) {
    console.error('[Direct SendGrid] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
