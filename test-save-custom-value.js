// Test saving custom value
console.log('🧪 Testing Custom Value Save');
console.log('============================');
console.log('');

console.log('📧 Testing custom value save...');

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

console.log('📊 Sending data with custom value:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

fetch('http://localhost:1337/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Save response:', data);
  console.log('');
  
  console.log('🔍 Now checking if custom value was saved...');
  
  // Check if the custom value was saved
  return fetch('http://localhost:1337/api/notifications?formId=23');
})
.then(res => res.json())
.then(settings => {
  console.log('✅ Settings after save:');
  console.log(JSON.stringify(settings, null, 2));
  console.log('');
  
  if (settings && settings.custom_value) {
    console.log('✅ Custom value was saved successfully!');
    console.log('📊 Custom value:', settings.custom_value);
  } else {
    console.log('❌ Custom value was NOT saved');
    console.log('🔍 Available fields in settings:');
    console.log(Object.keys(settings || {}));
  }
  
  console.log('');
  console.log('🔧 If custom value is not saved:');
  console.log('1. Check the server logs for the save request');
  console.log('2. Check if customValue is in the request body');
  console.log('3. Check if the Xano API is receiving the custom_value field');
  console.log('4. Check if there are any errors in the save process');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
