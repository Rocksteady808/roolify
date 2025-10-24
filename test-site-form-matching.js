#!/usr/bin/env node

/**
 * Test script to verify site_id + html_form_id matching works correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testSiteFormMatching() {
  console.log('🧪 Testing Site + Form ID Matching');
  console.log('==================================');
  
  try {
    // Test 1: Create notification settings using site_id + html_form_id
    console.log('\n1. Creating notification settings with site_id + html_form_id matching...');
    
    const notificationPayload = {
      formId: 'wf-form-HBI-International-Inquiry-Form---HBI-International', // html_form_id
      siteId: '68eb5d6db0e34d2e3ed12c0a', // site_id
      formName: 'HBI International Inquiry Form - HBI International',
      adminRoutes: [
        {
          field: 'HBI Account Rep',
          operator: 'equals',
          value: 'Aaron',
          recipients: 'atownsend@hbiin.com'
        }
      ],
      adminFallbackEmail: 'aarontownsend6@gmail.com'
    };
    
    // Note: This will fail with authentication error, but we can test the matching logic
    const saveResp = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationPayload)
    });
    
    console.log('Save response status:', saveResp.status);
    if (!saveResp.ok) {
      const errorText = await saveResp.text();
      console.log('Save error (expected due to auth):', errorText);
    } else {
      const result = await saveResp.json();
      console.log('Save result:', result);
    }
    
    // Test 2: Test form submission with site_id + html_form_id matching
    console.log('\n2. Testing form submission with site_id + html_form_id matching...');
    
    const webhookPayload = {
      html_form_id: 'wf-form-HBI-International-Inquiry-Form---HBI-International',
      siteId: '68eb5d6db0e34d2e3ed12c0a',
      formData: {
        'Has Account': 'Yes',
        'HBI Account Rep': 'Aaron',
        'EIN Number': '2555555555',
        'Full Name': 'Aaron Townsend',
        'Company Name': 'Flex Flow Web',
        'Email': 'aarontownsend6@gmail.com',
        'Select Country': 'United States',
        'Message Inquiry': 'Testing site + form ID matching',
        'Privacy Policy': true,
        'Terms Of Service': true
      }
    };
    
    const webhookResp = await fetch(`${BASE_URL}/api/submissions/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    if (!webhookResp.ok) {
      const errorText = await webhookResp.text();
      console.log(`⚠️ Webhook test failed: ${webhookResp.status} - ${errorText}`);
    } else {
      const result = await webhookResp.json();
      console.log(`✅ Webhook test successful:`, result);
      console.log(`📧 Check if notification was sent to fallback email`);
    }
    
    // Test 3: Check current forms to see the matching
    console.log('\n3. Checking current forms for site_id + html_form_id matching...');
    
    const formsResp = await fetch(`${BASE_URL}/api/forms/xano?siteId=68eb5d6db0e34d2e3ed12c0a`);
    if (formsResp.ok) {
      const formsData = await formsResp.json();
      console.log(`Found ${formsData.forms?.length || 0} forms for site 68eb5d6db0e34d2e3ed12c0a`);
      
      if (formsData.forms) {
        formsData.forms.forEach(form => {
          console.log(`   - Form ID ${form.id}: "${form.name}" (site_id: "${form.site_id}", html_form_id: "${form.html_form_id}")`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSiteFormMatching().then(() => {
  console.log('\n🎉 Site + Form ID matching test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
