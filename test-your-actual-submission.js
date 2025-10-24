// Test with your actual form submission data
console.log('🧪 Testing Your Actual Form Submission');
console.log('=====================================');
console.log('');

console.log('📧 Using your real form submission data...');

// This is the exact data from your form submission (from the console logs)
const yourFormData = {
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

console.log('📊 Your form submission data:');
console.log(JSON.stringify(yourFormData, null, 2));
console.log('');

console.log('🎯 Expected Results:');
console.log('1. ✅ Form submission stored in database');
console.log('2. ✅ Notification settings loaded for formId 23');
console.log('3. ✅ Field "HBI Account Rep" = "Aaron" matches conditional route');
console.log('4. ✅ Email sent to atownsend@hbiin.com (conditional routing)');
console.log('5. ✅ Email sent to aarontownsend6@gmail.com (fallback)');
console.log('');

console.log('📧 Submitting your form data...');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(yourFormData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Check server console for these logs:');
  console.log('- [Email] 🔍 RAW SETTINGS FROM XANO: {...}');
  console.log('- [Email] 🔍 Processing X admin routes');
  console.log('- [Email] 🔍 Checking route: {...}');
  console.log('- [Email] 🔍 Comparing: {...}');
  console.log('- [Email] 🔍 Route matches: true');
  console.log('- [Email] ✅ Admin route matched - Field: HBI Account Rep');
  console.log('- [Email] Sending to X admin recipient(s): [...]');
  console.log('- [Email] Email sent successfully via SendGrid');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- atownsend@hbiin.com (should receive email due to conditional routing)');
  console.log('- aarontownsend6@gmail.com (should receive email as fallback)');
  console.log('- Check spam folders if not received');
  console.log('');
  
  console.log('🎉 If you receive both emails:');
  console.log('- ✅ Conditional routing is working perfectly!');
  console.log('- ✅ Field matching is working correctly!');
  console.log('- ✅ Email sending is working!');
  console.log('- ✅ Your form submission will work in production!');
  console.log('');
  
  console.log('🐛 If you only receive fallback email:');
  console.log('- Check field name matching in server logs');
  console.log('- Verify "HBI Account Rep" field name is exact');
  console.log('- Check if field value "Aaron" matches exactly');
  console.log('');
  
  console.log('🐛 If you receive no emails:');
  console.log('- Check server logs for SendGrid errors');
  console.log('- Check email addresses are valid');
  console.log('- Check spam folders');
  console.log('- Check SendGrid dashboard for delivery status');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('1. Make sure the server is running (npm run dev)');
  console.log('2. Check if the webhook endpoint is accessible');
  console.log('3. Check server logs for any errors');
});
