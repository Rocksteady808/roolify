// Comprehensive conditional routing test
console.log('🧪 Comprehensive Conditional Routing Test');
console.log('==========================================');
console.log('');

// Test 1: Verify notification settings exist
console.log('📋 Test 1: Checking notification settings...');
fetch('http://localhost:1337/api/notifications?formId=23')
  .then(res => res.json())
  .then(settings => {
    console.log('✅ Settings found:', !!settings && Object.keys(settings).length > 0);
    
    if (settings && settings.admin_routes) {
      console.log('📊 Admin routes configured:', settings.admin_routes.length);
      settings.admin_routes.forEach((route, i) => {
        console.log(`  Route ${i+1}: ${route.field} ${route.operator} "${route.value}" → ${route.recipients}`);
      });
    }
    
    if (settings && settings.admin_fallback_email) {
      console.log('📧 Fallback email:', settings.admin_fallback_email);
    }
    
    console.log('');
    
    // Test 2: Submit form with exact matching data
    console.log('📧 Test 2: Submitting form with matching data...');
    const testData = {
      "Full Name": "Test User",
      "Email": "test@example.com",
      "HBI Account Rep": "Aaron",  // This should match the route
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0",
      "pageUrl": "https://example.com/test",
      "pageTitle": "Comprehensive Test"
    };
    
    console.log('Form data:', JSON.stringify(testData, null, 2));
    console.log('');
    
    return fetch('http://localhost:1337/api/submissions/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Submission response:', data);
    console.log('');
    
    console.log('📋 Expected behavior:');
    console.log('1. ✅ Form submission stored in database');
    console.log('2. ✅ Notification settings loaded from Xano');
    console.log('3. ✅ Admin routes processed');
    console.log('4. ✅ Field "HBI Account Rep" = "Aaron" matches route');
    console.log('5. ✅ Email sent to atownsend@hbiin.com');
    console.log('6. ✅ Email sent to aarontownsend6@gmail.com (fallback)');
    console.log('');
    
    console.log('🔍 Debugging steps:');
    console.log('1. Check server console for detailed logs');
    console.log('2. Look for "[Email] ✅ Admin route matched"');
    console.log('3. Look for "[Email] Sending to X admin recipient(s)"');
    console.log('4. Check email inboxes (including spam)');
    console.log('5. Check SendGrid dashboard for delivery status');
    console.log('');
    
    console.log('🐛 If routing is not working:');
    console.log('1. Check if field names match exactly');
    console.log('2. Check if values match exactly (case-sensitive)');
    console.log('3. Check if notification settings are saved correctly');
    console.log('4. Check if SendGrid API is working');
    console.log('5. Check if email addresses are valid');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
