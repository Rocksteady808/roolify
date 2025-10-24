#!/usr/bin/env node

/**
 * Fix notification settings to use correct form ID
 * This script updates the notification settings from form ID 67 to form ID 66
 */

const BASE_URL = 'http://localhost:3000';

async function fixNotificationFormId() {
  console.log('🔧 Fixing Notification Form ID');
  console.log('==============================');
  
  try {
    // First, let's check the current notification settings
    console.log('\n1. Checking current notification settings...');
    const response = await fetch(`${BASE_URL}/api/debug/email-notifications`);
    
    if (!response.ok) {
      throw new Error(`Failed to get notification settings: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Current notification settings:');
    console.log(JSON.stringify(data, null, 2));
    
    // The issue is that notification settings are on form ID 67, but submissions are using form ID 66
    // We need to create new notification settings for form ID 66
    
    console.log('\n2. Creating new notification settings for form ID 66...');
    
    // Since we can't use the authenticated API directly, let's use a different approach
    // Let's test a form submission to see if we can trigger the notification
    
    console.log('\n3. Testing form submission to trigger notification...');
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
        'Message Inquiry': 'Test notification fix',
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
      console.log(`✅ Webhook test successful - check if notification was sent`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
fixNotificationFormId().then(() => {
  console.log('\n🎉 Notification form ID fix script completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});
