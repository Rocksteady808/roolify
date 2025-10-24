// Test custom value in email generation
console.log('🧪 Testing Custom Value in Email Generation');
console.log('==========================================');
console.log('');

console.log('📧 Testing how custom value is applied in emails...');

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

console.log('🔍 The issue:');
console.log('- Custom value is saved correctly ✅');
console.log('- Custom value is loaded correctly ✅');
console.log('- But custom value is not applied to form fields in emails ❌');
console.log('');

console.log('🐛 Current logic only applies custom value to checkboxes:');
console.log('- "Privacy Policy": "on" → should use custom value');
console.log('- "Terms of Service": "on" → should use custom value');
console.log('- But other fields like "HBI Account Rep" are not affected');
console.log('');

console.log('💡 Expected behavior:');
console.log('- Custom value should be applied to ALL fields that match the pattern');
console.log('- Not just checkbox fields');
console.log('- The custom value should replace field values in email templates');
console.log('');

console.log('🔧 To fix this:');
console.log('1. Modify the replaceTemplateVariables function');
console.log('2. Apply custom value to all field types, not just checkboxes');
console.log('3. Test with your form submission');
console.log('');

console.log('📧 Let me submit your form to see the current behavior...');

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
  console.log('- [Email] Using custom value "..." for checkbox field "..."');
  console.log('- Look for which fields are getting custom values');
  console.log('- Check if non-checkbox fields are getting custom values');
  console.log('');
  
  console.log('📧 Check your email inboxes:');
  console.log('- Look at the email content');
  console.log('- Check if custom values are applied to the right fields');
  console.log('- Check if checkbox fields show custom values');
  console.log('- Check if other fields show custom values');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
