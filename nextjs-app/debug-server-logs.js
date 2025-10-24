// Debug server logs
console.log('🔍 Debugging Server Logs');
console.log('========================');
console.log('');

console.log('📧 Testing webhook and checking for server logs...');

const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📊 Test data:', JSON.stringify(testData, null, 2));
console.log('');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 The server should now show these logs in the terminal where you ran "npm run dev":');
  console.log('');
  console.log('Expected server logs:');
  console.log('1. [Submission Webhook] 📧 About to call sendNotificationEmails for form: 23');
  console.log('2. [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('3. [Email] 📧 Custom value available: true/false');
  console.log('4. [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('5. [Submission Webhook] ✅ sendNotificationEmails completed successfully');
  console.log('');
  console.log('🐛 If you don\'t see these logs:');
  console.log('1. The server terminal window is not visible');
  console.log('2. The server is not running properly');
  console.log('3. There\'s an error in the sendNotificationEmails function');
  console.log('4. The logs are being suppressed');
  console.log('');
  console.log('💡 To find the server terminal:');
  console.log('1. Look for a terminal window with "next dev" or "npm run dev"');
  console.log('2. It should show "Ready - started server on 0.0.0.0:1337"');
  console.log('3. Check that terminal for the debugging logs above');
  console.log('');
  console.log('🔧 If you still can\'t see the logs:');
  console.log('1. Try restarting the server: Ctrl+C, then npm run dev');
  console.log('2. Check if there are any error messages');
  console.log('3. Make sure the server is running on port 1337');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
