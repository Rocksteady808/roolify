// Test webhook endpoint directly
console.log('🧪 Testing Webhook Endpoint');
console.log('===========================');
console.log('');

console.log('📋 Testing webhook endpoint with different scenarios...');
console.log('');

// Test 1: Basic webhook functionality
console.log('📧 Test 1: Basic webhook test');
const basicTest = {
  "Full Name": "Webhook Test",
  "Email": "webhook@test.com",
  "formId": "wf-form-test",
  "formName": "Test Form",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(basicTest)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Basic webhook test:', data.success ? 'SUCCESS' : 'FAILED');
  console.log(`📊 Response:`, data);
  console.log('');
  
  // Test 2: With formId that has notification settings
  console.log('📧 Test 2: With formId 23 (has notification settings)');
  const testWithSettings = {
    "Full Name": "Settings Test",
    "Email": "settings@test.com",
    "HBI Account Rep": "Aaron",
    "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
    "formName": "HBI International Inquiry Form - HBI International",
    "siteId": "68bc42f58e22a62ce5c282e0"
  };
  
  return fetch('http://localhost:1337/api/submissions/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testWithSettings)
  });
})
.then(res => res.json())
.then(data => {
  console.log('✅ Settings test:', data.success ? 'SUCCESS' : 'FAILED');
  console.log(`📊 Response:`, data);
  console.log('');
  
  console.log('📋 What to check:');
  console.log('1. Both tests should return success: true');
  console.log('2. Check server logs for email processing');
  console.log('3. Check your email inbox for notifications');
  console.log('4. If Test 2 works but real form doesn\'t, there\'s a data mismatch');
  console.log('');
  
  console.log('🔍 If Test 2 works but real form doesn\'t:');
  console.log('1. The webhook is working correctly');
  console.log('2. The issue is in the real form data');
  console.log('3. Compare real form data with our test data');
  console.log('4. Look for differences in field names, values, or formId');
  console.log('');
  
  console.log('🔧 To debug the real form:');
  console.log('1. Submit the real form');
  console.log('2. Check browser Network tab for the webhook request');
  console.log('3. Copy the exact request payload');
  console.log('4. Compare with our test data');
  console.log('5. Identify the differences');
})
.catch(err => {
  console.error('❌ Webhook test failed:', err.message);
});
