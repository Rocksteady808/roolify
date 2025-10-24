// Test email sending specifically
console.log('📧 Testing Email Sending');
console.log('========================');
console.log('');

console.log('🔍 The Issue:');
console.log('- Form submissions work ✅');
console.log('- Conditional routing logic should work ✅');
console.log('- But emails are not being received ❌');
console.log('');

console.log('📋 This means the issue is in email sending, not form processing');
console.log('');

console.log('🔍 Possible email issues:');
console.log('1. SendGrid API problems');
console.log('2. Email validation errors');
console.log('3. Email delivery issues (spam, blocked)');
console.log('4. Server errors in email processing');
console.log('');

console.log('📧 Let\'s test email sending directly...');

// Test with the exact real form data
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

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(realFormData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Now check the server console for email processing logs:');
  console.log('');
  console.log('📋 Look for these specific log messages:');
  console.log('1. "[Email] 🔍 RAW SETTINGS FROM XANO: {...}"');
  console.log('2. "[Email] 🔍 Processing X admin routes"');
  console.log('3. "[Email] 🔍 Checking route: {...}"');
  console.log('4. "[Email] 🔍 Comparing: {...}"');
  console.log('5. "[Email] 🔍 Route matches: true"');
  console.log('6. "[Email] ✅ Admin route matched - Field: HBI Account Rep"');
  console.log('7. "[Email] Sending to X admin recipient(s): [...]"');
  console.log('8. "[Email] Sending email to: atownsend@hbiin.com"');
  console.log('9. "[Email] Sending email to: aarontownsend6@gmail.com"');
  console.log('');
  console.log('🐛 If you DON\'T see these logs, the issue is:');
  console.log('- Notification settings not found');
  console.log('- Email processing not triggered');
  console.log('- Server error in email processing');
  console.log('');
  console.log('🐛 If you see the logs but no emails, the issue is:');
  console.log('- SendGrid API errors');
  console.log('- Email validation errors');
  console.log('- Email delivery issues (spam, blocked)');
  console.log('');
  console.log('📧 Check these email inboxes:');
  console.log('- atownsend@hbiin.com (conditional routing)');
  console.log('- aarontownsend6@gmail.com (fallback)');
  console.log('- Check spam folders');
  console.log('- Check SendGrid dashboard for delivery status');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
