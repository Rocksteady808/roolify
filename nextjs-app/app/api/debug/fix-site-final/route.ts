import { NextResponse } from 'next/server';
import { xanoNotifications, xanoSites } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Fix Site Final] Deleting old settings and creating new ones for correct site...');
    
    // Delete the current settings (ID 54)
    await xanoNotifications.delete(54);
    console.log('[Fix Site Final] ✅ Deleted old settings');
    
    // Get the correct site ID
    const allSites = await xanoSites.getAll();
    const correctSite = allSites.find(s => s.webflow_site_id === '68eb5d6db0e34d2e3ed12c0a');
    
    if (!correctSite) {
      throw new Error('Site not found');
    }
    
    console.log('[Fix Site Final] Using site ID:', correctSite.id, 'for site:', correctSite.webflow_site_id);
    
    // Create new settings for the correct site and form
    const newSettings = await xanoNotifications.create({
      form: 102,                    // Form 102 (the one receiving submissions)
      user: 1,                     // User 1
      site: correctSite.id,         // Correct site ID
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
    
    console.log('[Fix Site Final] ✅ Created new settings for correct site');
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings created for correct site',
      settings: newSettings
    });
    
  } catch (error: any) {
    console.error('[Fix Site Final] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fix site mismatch'
    }, { status: 500 });
  }
}

