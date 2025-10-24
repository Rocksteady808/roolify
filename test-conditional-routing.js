// Test conditional routing with actual form data
console.log('🧪 Testing Conditional Routing');
console.log('==============================');
console.log('');

// Test 1: Submit a form with conditional routing data
const testData = {
  "Full Name": "John Doe",
  "Email": "john@example.com", 
  "HBI Account Rep": "Aaron",  // This should trigger conditional routing
  "Company Name": "Test Company",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0",
  "pageUrl": "https://example.com/test",
  "pageTitle": "Conditional Routing Test"
};

console.log('📧 Test 1: Submitting form with conditional routing...');
console.log('Form data:', JSON.stringify(testData, null, 2));
console.log('');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Response:', data);
  console.log('');
  console.log('📋 What to check:');
  console.log('1. Look for console logs showing route matching');
  console.log('2. Check if "HBI Account Rep" field is being matched');
  console.log('3. Verify the field value "Aaron" matches the route condition');
  console.log('4. Check your email to see if conditional routing worked');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
