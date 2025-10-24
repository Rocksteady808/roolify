// Test custom value fix
console.log('🧪 Testing Custom Value Fix');
console.log('===========================');
console.log('');

console.log('📧 Testing the fixed custom value logic...');

// Test with your actual form data
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

console.log('📊 Form data:');
console.log(JSON.stringify(yourFormData, null, 2));
console.log('');

console.log('🔧 Fixed logic:');
console.log('- Custom value now applies to ALL fields (not just checkboxes)');
console.log('- Checkbox fields: Only apply custom value if checked');
console.log('- Non-checkbox fields: Apply custom value to all');
console.log('- Custom value template: "I have read the info for {{field}}"');
console.log('');

console.log('🎯 Expected results:');
console.log('- "HBI Account Rep": "Aaron" → "I have read the info for HBI Account Rep"');
console.log('- "Full Name": "Aaron Townsend" → "I have read the info for Full Name"');
console.log('- "Privacy Policy": "on" → "I have read the info for Privacy Policy"');
console.log('- "Terms of Service": "on" → "I have read the info for Terms of Service"');
console.log('');

console.log('📧 Submitting form to test the fix...');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(yourFormData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Check server logs for:');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "HBI Account Rep"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for field "Full Name"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- Look at the email content');
  console.log('- All fields should now show custom values');
  console.log('- Check if "HBI Account Rep" shows custom value');
  console.log('- Check if "Full Name" shows custom value');
  console.log('- Check if checkbox fields show custom values');
  console.log('');
  
  console.log('🎉 If you see custom values in the email:');
  console.log('- ✅ Custom value fix is working!');
  console.log('- ✅ All fields are getting custom values!');
  console.log('- ✅ Your form submissions will show custom values!');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
