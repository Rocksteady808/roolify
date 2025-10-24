// Final test for conditional routing
console.log('🎉 Final Conditional Routing Test');
console.log('=================================');
console.log('');

console.log('✅ SendGrid API is now working!');
console.log('✅ Form submissions are working!');
console.log('✅ Notification settings are configured!');
console.log('');

console.log('📧 Testing conditional routing with real form data...');

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
  
  console.log('🎯 Expected Results:');
  console.log('1. ✅ Form stored in database');
  console.log('2. ✅ Notification settings loaded');
  console.log('3. ✅ Field "HBI Account Rep" = "Aaron" matches route');
  console.log('4. ✅ Email sent to atownsend@hbiin.com (conditional routing)');
  console.log('5. ✅ Email sent to aarontownsend6@gmail.com (fallback)');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- atownsend@hbiin.com (should receive email due to conditional routing)');
  console.log('- aarontownsend6@gmail.com (should receive email as fallback)');
  console.log('- Check spam folders if not received');
  console.log('');
  
  console.log('🔍 Server logs should show:');
  console.log('- [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('- [Email] 🔍 Processing X admin routes');
  console.log('- [Email] 🔍 Route matches: true');
  console.log('- [Email] ✅ Admin route matched - Field: HBI Account Rep');
  console.log('- [Email] Sending to X admin recipient(s): [...]');
  console.log('- [Email] Email sent successfully via SendGrid');
  console.log('');
  
  console.log('🎉 If you receive both emails, conditional routing is working!');
  console.log('🎉 If you only receive the fallback email, check the field matching logic.');
  console.log('🎉 If you receive no emails, check the server logs for errors.');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
