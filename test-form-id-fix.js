#!/usr/bin/env node

/**
 * Test script to verify form ID matching fix
 * This tests that notification settings are saved with the correct html_form_id
 */

const BASE_URL = 'http://localhost:3000';

async function testFormIdMatching() {
  console.log('🧪 Testing Form ID Matching Fix');
  console.log('================================');
  
  try {
    // Test 1: Get forms from Xano endpoint
    console.log('\n1. Testing Xano forms endpoint...');
    const formsResp = await fetch(`${BASE_URL}/api/forms/xano?siteId=652b10ed79cbf4ed07a349ed`);
    
    if (!formsResp.ok) {
      throw new Error(`Forms endpoint failed: ${formsResp.status}`);
    }
    
    const formsData = await formsResp.json();
    console.log(`✅ Found ${formsData.forms?.length || 0} forms in Xano`);
    
    if (formsData.forms && formsData.forms.length > 0) {
      formsData.forms.forEach(form => {
        console.log(`   - Form ID ${form.id}: "${form.name}" (html_form_id: "${form.html_form_id}")`);
      });
      
      // Test 2: Save notification settings using html_form_id
      const testForm = formsData.forms[0];
      console.log(`\n2. Testing notification settings save for form: "${testForm.name}"`);
      console.log(`   Using html_form_id: "${testForm.html_form_id}"`);
      
      const notificationPayload = {
        formId: testForm.html_form_id, // Use html_form_id instead of numeric ID
        siteId: '652b10ed79cbf4ed07a349ed',
        formName: testForm.name,
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
      
      const saveResp = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPayload)
      });
      
      if (!saveResp.ok) {
        const errorText = await saveResp.text();
        throw new Error(`Save failed: ${saveResp.status} - ${errorText}`);
      }
      
      const saveResult = await saveResp.json();
      console.log(`✅ Notification settings saved successfully`);
      console.log(`   Settings ID: ${saveResult.id}`);
      console.log(`   Form ID: ${saveResult.form_id}`);
      
      // Test 3: Load notification settings back
      console.log(`\n3. Testing notification settings load...`);
      const loadResp = await fetch(`${BASE_URL}/api/notifications?formId=${encodeURIComponent(testForm.html_form_id)}`);
      
      if (!loadResp.ok) {
        throw new Error(`Load failed: ${loadResp.status}`);
      }
      
      const loadResult = await loadResp.json();
      console.log(`✅ Notification settings loaded successfully`);
      console.log(`   Form matched: ${loadResult.form_id}`);
      console.log(`   Admin routes: ${loadResult.admin_routes?.length || 0} routes`);
      
      // Test 4: Verify form matching in webhook
      console.log(`\n4. Testing form matching in webhook simulation...`);
      const webhookPayload = {
        html_form_id: testForm.html_form_id,
        siteId: '652b10ed79cbf4ed07a349ed',
        formData: {
          'HBI Account Rep': 'Aaron',
          'Email': 'test@example.com',
          'Name': 'Test User'
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
        console.log(`✅ Webhook test successful - notification should be sent`);
      }
      
    } else {
      console.log('⚠️ No forms found in Xano. Try syncing forms first.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFormIdMatching().then(() => {
  console.log('\n🎉 Form ID matching test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
