// Force server to show email processing logs
console.log('🔍 Forcing Server Logs to Show');
console.log('==============================');
console.log('');

console.log('📧 Submitting form to trigger server logs...');

const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 NOW CHECK YOUR SERVER TERMINAL WINDOW!');
  console.log('Look for these logs in the terminal where you ran "npm run dev":');
  console.log('');
  console.log('Expected server logs:');
  console.log('- [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('- [Email] 📧 Custom value available: true/false');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  console.log('🐛 If you don\'t see these logs:');
  console.log('1. The server terminal window is not visible');
  console.log('2. The server is not processing the webhook');
  console.log('3. There\'s an error in the server code');
  console.log('');
  console.log('💡 To find the server terminal:');
  console.log('1. Look for a terminal window with "next dev" or "npm run dev"');
  console.log('2. It should show "Ready - started server on 0.0.0.0:1337"');
  console.log('3. Check that terminal for the email processing logs');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
