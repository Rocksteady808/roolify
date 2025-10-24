// Test with the exact real form data from the console logs
console.log('🧪 Testing with Real Form Data');
console.log('==============================');
console.log('');

// This is the exact data from the real form submission
const realFormData = {
  "Has Account": "Yes",
  "HBI Account Rep": "Aaron",
  "EIN Number": "2555555555", 
  "Full Name": "Aaron Townsend",
  "Company Name": "Flex Flow Web",
  "Email": "aarontownsend6@gmail.com",
  "Select Country": "United States",
  "Message Inquiry": "This is a test",
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📧 Submitting with real form data...');
console.log('Data:', JSON.stringify(realFormData, null, 2));
console.log('');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(realFormData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Response:', data);
  console.log('');
  
  console.log('📋 Expected behavior:');
  console.log('1. ✅ Form submission stored (submissionId: 97+)');
  console.log('2. ✅ Notification settings loaded for formId 23');
  console.log('3. ✅ Field "HBI Account Rep" = "Aaron" matches route');
  console.log('4. ✅ Email sent to atownsend@hbiin.com');
  console.log('5. ✅ Email sent to aarontownsend6@gmail.com (fallback)');
  console.log('');
  
  console.log('🔍 Check server console for these logs:');
  console.log('- [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('- [Email] 🔍 Processing X admin routes');
  console.log('- [Email] 🔍 Checking route: {...}');
  console.log('- [Email] 🔍 Comparing: {...}');
  console.log('- [Email] 🔍 Route matches: true');
  console.log('- [Email] ✅ Admin route matched - Field: HBI Account Rep');
  console.log('- [Email] Sending to X admin recipient(s): [...]');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- atownsend@hbiin.com (conditional routing)');
  console.log('- aarontownsend6@gmail.com (fallback)');
  console.log('- Check spam folders');
  console.log('');
  
  console.log('🐛 If no emails are sent, check for:');
  console.log('1. SendGrid API errors in server logs');
  console.log('2. Email validation errors');
  console.log('3. Notification settings not found');
  console.log('4. Field matching issues');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
