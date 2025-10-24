// Debug webhook processing step by step
console.log('🔍 Debugging Webhook Processing');
console.log('===============================');
console.log('');

console.log('📧 Step 1: Testing webhook endpoint directly...');

const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📊 Test data:', JSON.stringify(testData, null, 2));
console.log('');

fetch('http://localhost:3000/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => {
  console.log('📧 Step 2: Webhook response status:', res.status);
  console.log('📧 Step 3: Webhook response headers:', Object.fromEntries(res.headers.entries()));
  return res.json();
})
.then(data => {
  console.log('📧 Step 4: Webhook response data:', data);
  console.log('');
  
  console.log('🔍 Step 5: Checking if server processed the webhook...');
  console.log('Expected server logs in your terminal:');
  console.log('- [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('- [Email] 📧 Custom value available: true/false');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('');
  
  console.log('🐛 If you don\'t see these logs:');
  console.log('1. Server terminal is not visible');
  console.log('2. Server is not running on port 1337');
  console.log('3. Webhook is failing silently');
  console.log('4. Email processing is not being triggered');
  console.log('');
  
  console.log('💡 To check server status:');
  console.log('1. Look for terminal with "next dev" or "npm run dev"');
  console.log('2. Check if it shows "Ready - started server on 0.0.0.0:1337"');
  console.log('3. Look for any error messages in that terminal');
  console.log('4. Check if the webhook is being called (should see POST /api/submissions/webhook)');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  console.log('');
  console.log('🐛 This means:');
  console.log('1. Server is not running on port 1337');
  console.log('2. Server is not accessible');
  console.log('3. There\'s a network error');
  console.log('');
  console.log('💡 To fix:');
  console.log('1. Make sure server is running: npm run dev');
  console.log('2. Check if server is on port 1337');
  console.log('3. Check if there are any error messages');
});
