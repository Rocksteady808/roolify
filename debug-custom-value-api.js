// Debug custom value API call
console.log('🔍 Debugging Custom Value API Call');
console.log('==================================');
console.log('');

console.log('📧 Testing custom value save with detailed logging...');

const testData = {
  formId: "wf-form-HBI-International-Inquiry-Form---HBI-International",
  siteId: "68bc42f58e22a62ce5c282e0",
  formName: "HBI International Inquiry Form - HBI International",
  adminRecipients: "aarontownsend6@gmail.com",
  userRecipients: "",
  adminRoutes: [
    {
      field: "HBI Account Rep",
      operator: "equals",
      value: "Aaron",
      recipients: "atownsend@hbiin.com"
    }
  ],
  userRoutes: [],
  emailTemplate: null,
  adminSubject: "New Contact Form Submission",
  userSubject: "Thank you for your submission",
  customValue: "I have read the info for {{field}}"  // Test custom value
};

console.log('📊 Request data:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

console.log('🔍 Watch the server console for these logs:');
console.log('- [Notifications API] Processing save for formId: ...');
console.log('- [Notifications API] 🔍 UPDATE DATA: {...}');
console.log('- [Notifications API] Updated settings for form ...');
console.log('');

console.log('📧 Sending request...');

fetch('http://localhost:1337/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Response:', data);
  console.log('');
  
  console.log('🔍 Check the server console logs for:');
  console.log('1. "[Notifications API] 🔍 UPDATE DATA: {...}" - should include custom_value');
  console.log('2. Any Xano API errors');
  console.log('3. Any field mapping issues');
  console.log('');
  
  console.log('🐛 If custom_value is missing from UPDATE DATA:');
  console.log('1. The frontend is not sending customValue');
  console.log('2. The API is not receiving customValue');
  console.log('3. There\'s a field name mismatch');
  console.log('');
  
  console.log('🐛 If custom_value is in UPDATE DATA but not saved:');
  console.log('1. Xano database doesn\'t have custom_value column');
  console.log('2. Xano API is not handling custom_value field');
  console.log('3. There\'s a permission issue with the field');
  console.log('');
  
  console.log('🔧 Next steps:');
  console.log('1. Check server console logs');
  console.log('2. Look for custom_value in UPDATE DATA');
  console.log('3. Check for any Xano API errors');
  console.log('4. Verify the Xano database schema');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
