import { NextResponse } from 'next/server';
import { xanoNotifications } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Recreate Notification Settings] Deleting old settings and creating new ones...');
    
    // Delete the old notification settings (ID 53)
    await xanoNotifications.delete(53);
    console.log('[Recreate Notification Settings] ✅ Deleted old settings');
    
    // Create new notification settings for form 102
    const newSettings = await xanoNotifications.create({
      form: 102, // The form that's actually receiving submissions
      user: 1,
      site: 11,
      admin_routes: [
        {
          field: 'HBI Account Rep',
          operator: 'equals',
          value: 'Aaron',
          recipients: 'atownsend@hbiin.com'
        }
      ],
      user_routes: [],
      admin_fallback_email: '',
      user_fallback_email: '',
      custom_value: '',
      field_custom_values: {},
      email_template: '<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width,initial-scale=1" />\n    <title>New HBI International Inquiry Form - HBI International Submission</title>\n    <style>\n      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }\n      .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }\n      h2 { color: #333; margin-top: 0; }\n      .field-list { list-style: none; padding: 0; }\n      .field-list li { padding: 8px 0; border-bottom: 1px solid #eee; }\n      .field-list li:last-child { border-bottom: none; }\n      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }\n    </style>\n  </head>\n  <body>\n    <div class="card">\n      <h2>New HBI International Inquiry Form - HBI International Submission</h2>\n      <p>You have received a new submission from your website.</p>\n      <ul class="field-list">\n        <li><strong>Has Account:</strong> {{Has Account}}</li>\n        <li><strong>HBI Account Rep:</strong> {{HBI Account Rep}}</li>\n        <li><strong>EIN Number:</strong> {{EIN Number}}</li>\n        <li><strong>Full Name:</strong> {{Full Name}}</li>\n        <li><strong>Company Name:</strong> {{Company Name}}</li>\n        <li><strong>Email:</strong> {{Email}}</li>\n        <li><strong>Select Country:</strong> {{Select Country}}</li>\n        <li><strong>Message Inquiry:</strong> {{Message Inquiry}}</li>\n        <li><strong>Privacy Policy:</strong> {{Privacy Policy}}</li>\n        <li><strong>Terms Of Service:</strong> {{Terms Of Service}}</li>\n      </ul>\n      <div class="footer">\n        <p>This is an automated notification from your website.</p>\n      </div>\n    </div>\n  </body>\n</html>',
      admin_subject: 'New Contact Form Submission',
      user_subject: 'Thank you for your submission'
    });
    
    console.log('[Recreate Notification Settings] ✅ Created new settings for form 102');
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings recreated for form 102',
      settings: newSettings
    });
    
  } catch (error: any) {
    console.error('[Recreate Notification Settings] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to recreate notification settings'
    }, { status: 500 });
  }
}

