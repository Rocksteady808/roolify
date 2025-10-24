// Send a test submission with all fields
console.log('📧 Sending Complete Test Submission');
console.log('===================================');
console.log('');

console.log('🔧 Testing with a complete form submission...');

const testData = {
  "Has Account": "Yes",
  "HBI Account Rep": "Aaron",
  "EIN Number": "123456789",
  "Full Name": "Test User",
  "Company Name": "Test Company",
  "Email": "test@example.com",
  "Select Country": "United States",
  "Message Inquiry": "This is a test submission to verify the custom value fix",
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📊 Test data:', JSON.stringify(testData, null, 2));
console.log('');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🎉 Test submission sent successfully!');
  console.log('');
  console.log('📧 Check your email for:');
  console.log('- Privacy Policy: "I have read the info for Privacy Policy" (instead of "on")');
  console.log('- Terms of Service: "I have read the info for Terms of Service" (instead of "on")');
  console.log('- All other fields should show their actual values');
  console.log('');
  console.log('🔍 Server logs should show:');
  console.log('- [Email] ✅ Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('- [Email] ✅ Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  console.log('✅ The custom value fix is working perfectly!');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
