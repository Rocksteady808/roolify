// Test after adding custom_value column to Xano
console.log('🧪 Testing After Xano Database Fix');
console.log('===================================');
console.log('');

console.log('📋 After adding custom_value column to Xano database:');
console.log('');

console.log('📧 Test 1: Save custom value');
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
  customValue: "I have read the info for {{field}}"
};

fetch('http://localhost:1337/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Save response:', data);
  console.log('');
  
  console.log('📧 Test 2: Load custom value');
  return fetch('http://localhost:1337/api/notifications?formId=23');
})
.then(res => res.json())
.then(settings => {
  console.log('✅ Load response:');
  console.log(JSON.stringify(settings, null, 2));
  console.log('');
  
  if (settings && settings.custom_value) {
    console.log('🎉 SUCCESS! Custom value is now working!');
    console.log('📊 Custom value:', settings.custom_value);
    console.log('');
    console.log('✅ What should work now:');
    console.log('1. Set custom value in notifications page');
    console.log('2. Save settings');
    console.log('3. Refresh page');
    console.log('4. Custom value field should be populated');
    console.log('5. Custom value should be used in email templates');
  } else {
    console.log('❌ Custom value still not working');
    console.log('🔍 Check:');
    console.log('1. Did you add the custom_value column to Xano?');
    console.log('2. Is the column name exactly "custom_value"?');
    console.log('3. Is the column type "Text"?');
    console.log('4. Are there any Xano API errors in server logs?');
  }
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
