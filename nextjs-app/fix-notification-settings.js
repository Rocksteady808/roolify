#!/usr/bin/env node

/**
 * Fix notification settings by creating the correct site/form combination
 * This script will:
 * 1. Create a form record for the correct site and HTML form ID
 * 2. Create notification settings for that form
 */

const https = require('https');

const XANO_BASE_URL = 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

// The correct site and form combination from the logs
const CORRECT_SITE_ID = '68eb5d6db0e34d2e3ed12c0a';
const CORRECT_HTML_FORM_ID = 'wf-form-HBI-International-Inquiry-Form---HBI-International';
const FORM_NAME = 'HBI International Inquiry Form - HBI International';
const USER_ID = 1;

function makeXanoRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${XANO_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function fixNotificationSettings() {
  console.log('🚀 Fixing notification settings for correct site/form combination...');
  console.log(`📝 Site ID: ${CORRECT_SITE_ID}`);
  console.log(`📝 HTML Form ID: ${CORRECT_HTML_FORM_ID}`);
  console.log(`📝 Form Name: ${FORM_NAME}`);

  try {
    // Step 1: Create form record for the correct site and HTML form ID
    console.log('\n📋 Step 1: Creating form record...');
    const formData = {
      name: FORM_NAME,
      user_id: USER_ID,
      html_form_id: CORRECT_HTML_FORM_ID,
      site_id: CORRECT_SITE_ID
    };

    const formResponse = await makeXanoRequest('/form', 'POST', formData);
    console.log('Form creation response:', formResponse.status, formResponse.data);

    if (formResponse.status !== 200) {
      console.error('❌ Failed to create form record');
      return;
    }

    const formId = formResponse.data.id;
    console.log(`✅ Form created with ID: ${formId}`);

    // Step 2: Get the site record to get numeric site ID
    console.log('\n📋 Step 2: Getting site record...');
    const sitesResponse = await makeXanoRequest('/site');
    const sites = sitesResponse.data;
    const site = sites.find(s => s.webflow_site_id === CORRECT_SITE_ID);
    
    if (!site) {
      console.error('❌ Site not found for webflow_site_id:', CORRECT_SITE_ID);
      return;
    }

    console.log(`✅ Found site with ID: ${site.id}`);

    // Step 3: Create notification settings
    console.log('\n📋 Step 3: Creating notification settings...');
    const notificationData = {
      form: formId,
      user: USER_ID,
      site: site.id,
      admin_routes: JSON.stringify([
        {
          field: 'HBI Account Rep',
          operator: 'equals',
          value: 'Aaron',
          recipients: 'atownsend@hbiin.com'
        }
      ]),
      user_routes: JSON.stringify([]),
      admin_fallback_email: 'aarontownsend6@gmail.com',
      user_fallback_email: '',
      custom_value: '',
      field_custom_values: JSON.stringify({}),
      email_template: `<!doctype html>
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
      admin_subject: 'New Contact Form Submission',
      user_subject: 'Thank you for your submission'
    };

    const notificationResponse = await makeXanoRequest('/notification_setting', 'POST', notificationData);
    console.log('Notification creation response:', notificationResponse.status, notificationResponse.data);

    if (notificationResponse.status === 200) {
      console.log('✅ Notification settings created successfully!');
      console.log(`📊 Settings ID: ${notificationResponse.data.id}`);
      console.log(`📊 Form ID: ${notificationResponse.data.form}`);
      console.log(`📊 Site ID: ${notificationResponse.data.site}`);
      console.log(`📊 User ID: ${notificationResponse.data.user}`);
      
      console.log('\n🎯 Next steps:');
      console.log('1. Test form submission again');
      console.log('2. Check that atownsend@hbiin.com receives the notification');
      console.log('3. Verify the routing works based on "HBI Account Rep" field value');
    } else {
      console.error('❌ Failed to create notification settings');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
fixNotificationSettings();




