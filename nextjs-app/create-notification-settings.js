#!/usr/bin/env node

/**
 * Create notification settings for the correct site and form combination
 * This fixes the issue where notifications aren't being sent because the
 * webhook is looking for settings for a different site/form combination.
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:1337';

async function createNotificationSettings() {
  console.log('🚀 Creating notification settings for the correct site/form combination...');
  
  try {
    // First, let's check what sites exist in Xano
    console.log('📋 Checking existing sites...');
    const sitesResponse = await fetch(`${API_BASE}/api/webflow/sites`);
    const sitesData = await sitesResponse.json();
    console.log('Available sites:', sitesData.sites?.map(s => ({ id: s.id, name: s.name })));

    // The correct site and form combination from the logs
    const siteId = '68eb5d6db0e34d2e3ed12c0a';
    const htmlFormId = 'wf-form-HBI-International-Inquiry-Form---HBI-International';
    const formName = 'HBI International Inquiry Form - HBI International';

    console.log(`\n📝 Creating notification settings for:`);
    console.log(`   Site ID: ${siteId}`);
    console.log(`   HTML Form ID: ${htmlFormId}`);
    console.log(`   Form Name: ${formName}`);

    // Create notification settings with the same configuration as the existing ones
    const notificationData = {
      formId: htmlFormId,
      siteId: siteId,
      formName: formName,
      adminRoutes: [
        {
          field: 'HBI Account Rep',
          operator: 'equals',
          value: 'Aaron',
          recipients: 'atownsend@hbiin.com'
        }
      ],
      userRoutes: [],
      adminRecipients: 'aarontownsend6@gmail.com',
      userRecipients: '',
      emailTemplate: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New HBI International Inquiry Form - HBI International Submission</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
      .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
      h2 { color: #333; margin-top: 0; }
      .field-list { list-style: none; padding: 0; }
      .field-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
      .field-list li:last-child { border-bottom: none; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>New HBI International Inquiry Form - HBI International Submission</h2>
      <p>You have received a new submission from your website.</p>
      <ul class="field-list">
        <li><strong>Has Account:</strong> {{Has Account}}</li>
        <li><strong>HBI Account Rep:</strong> {{HBI Account Rep}}</li>
        <li><strong>EIN Number:</strong> {{EIN Number}}</li>
        <li><strong>Full Name:</strong> {{Full Name}}</li>
        <li><strong>Company Name:</strong> {{Company Name}}</li>
        <li><strong>Email:</strong> {{Email}}</li>
        <li><strong>Select Country:</strong> {{Select Country}}</li>
        <li><strong>Message Inquiry:</strong> {{Message Inquiry}}</li>
        <li><strong>Privacy Policy:</strong> {{Privacy Policy}}</li>
        <li><strong>Terms Of Service:</strong> {{Terms Of Service}}</li>
      </ul>
      <div class="footer">
        <p>This is an automated notification from your website.</p>
      </div>
    </div>
  </body>
</html>`,
      adminSubject: 'New Contact Form Submission',
      userSubject: 'Thank you for your submission',
      customValue: '',
      fieldCustomValues: {}
    };

    console.log('\n💾 Saving notification settings...');
    const response = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.XANO_AUTH_TOKEN || 'your-auth-token-here'
      },
      body: JSON.stringify(notificationData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Notification settings created successfully!');
      console.log('📊 Settings ID:', result.settings?.id);
      console.log('📊 Form ID:', result.settings?.form);
      console.log('📊 Site ID:', result.settings?.site);
      console.log('📊 User ID:', result.settings?.user);
      
      console.log('\n🎯 Next steps:');
      console.log('1. Test form submission again');
      console.log('2. Check that atownsend@hbiin.com receives the notification');
      console.log('3. Verify the routing works based on "HBI Account Rep" field value');
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to create notification settings:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Error creating notification settings:', error);
  }
}

// Run the script
createNotificationSettings();




