// Test detailed routing logic
console.log('🔍 Testing Detailed Routing Logic');
console.log('==================================');
console.log('');

// Test with the exact same data that should trigger routing
const testData = {
  "Full Name": "John Doe",
  "Email": "john@example.com", 
  "HBI Account Rep": "Aaron",  // This should match the route
  "Company Name": "Test Company",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0",
  "pageUrl": "https://example.com/test",
  "pageTitle": "Detailed Routing Test"
};

console.log('📧 Submitting form with detailed logging...');
console.log('Form data keys:', Object.keys(testData));
console.log('HBI Account Rep value:', testData["HBI Account Rep"]);
console.log('');

console.log('🔍 Expected routing logic:');
console.log('1. Field: "HBI Account Rep"');
console.log('2. Value: "Aaron"');
console.log('3. Operator: "equals"');
console.log('4. Should match: YES');
console.log('5. Should send to: atownsend@hbiin.com');
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
  console.log('📋 Check the server console logs for:');
  console.log('- [Email] 🔍 Processing X admin routes');
  console.log('- [Email] 🔍 Checking route: {...}');
  console.log('- [Email] 🔍 Comparing: {...}');
  console.log('- [Email] 🔍 Route matches: true/false');
  console.log('- [Email] ✅ Admin route matched - Field: ...');
  console.log('- [Email] Sending to X admin recipient(s): [...]');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
