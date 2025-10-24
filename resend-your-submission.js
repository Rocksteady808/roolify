// Resend your form submission to test custom value fix
console.log('📧 Resending Your Form Submission');
console.log('=================================');
console.log('');

console.log('🧪 Testing custom value fix with your actual form data...');

// Your exact form submission data
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

console.log('📊 Your form data:');
console.log(JSON.stringify(yourFormData, null, 2));
console.log('');

console.log('🔧 Custom value fix applied:');
console.log('- Custom value now applies to ALL fields');
console.log('- Not just checkbox fields');
console.log('- Field names are replaced in custom value template');
console.log('');

console.log('🎯 Expected email content:');
console.log('Instead of showing:');
console.log('- HBI Account Rep: Aaron');
console.log('- Full Name: Aaron Townsend');
console.log('- Privacy Policy: on');
console.log('- Terms of Service: on');
console.log('');
console.log('Should now show:');
console.log('- HBI Account Rep: I have read the info for HBI Account Rep');
console.log('- Full Name: I have read the info for Full Name');
console.log('- Privacy Policy: I have read the info for Privacy Policy');
console.log('- Terms of Service: I have read the info for Terms of Service');
console.log('');

console.log('📧 Submitting your form...');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(yourFormData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Watch server console for these logs:');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "HBI Account Rep"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Full Name"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Company Name"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Email"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Select Country"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Message Inquiry"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- atownsend@hbiin.com (conditional routing)');
  console.log('- aarontownsend6@gmail.com (fallback)');
  console.log('- Check spam folders');
  console.log('');
  
  console.log('🎉 If you see custom values in the email:');
  console.log('- ✅ Custom value fix is working!');
  console.log('- ✅ All fields are getting custom values!');
  console.log('- ✅ Your form submissions will show custom values!');
  console.log('');
  
  console.log('🐛 If you still see original values:');
  console.log('- Check server logs for custom value application');
  console.log('- Verify custom value is loaded from database');
  console.log('- Check if there are any errors in email generation');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('1. Make sure the server is running');
  console.log('2. Check if the webhook endpoint is accessible');
  console.log('3. Check server logs for any errors');
});
