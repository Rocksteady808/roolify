// Debug webhook routing with detailed logging
console.log('🐛 Debugging Webhook Routing');
console.log('============================');
console.log('');

const testData = {
  "Full Name": "John Doe",
  "Email": "john@example.com", 
  "HBI Account Rep": "Aaron",
  "Company Name": "Test Company",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0",
  "pageUrl": "https://example.com/test",
  "pageTitle": "Debug Routing Test"
};

console.log('📧 Test data:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

console.log('🔍 Field matching simulation:');
const routeField = "HBI Account Rep";
const routeValue = "Aaron";
const routeOperator = "equals";

console.log(`Route field: "${routeField}"`);
console.log(`Route value: "${routeValue}"`);
console.log(`Route operator: "${routeOperator}"`);
console.log('');

// Simulate the webhook logic
let fieldValue = testData[routeField] || '';
console.log(`Direct lookup testData["${routeField}"]: "${fieldValue}"`);

if (!fieldValue) {
  console.log('Direct lookup failed, trying substring matching...');
  const matchingKey = Object.keys(testData).find(key => 
    key === routeField || 
    key.toLowerCase().includes(routeField.toLowerCase()) ||
    routeField.toLowerCase().includes(key.toLowerCase())
  );
  
  if (matchingKey) {
    fieldValue = testData[matchingKey];
    console.log(`Found by substring match: "${matchingKey}" = "${fieldValue}"`);
  }
}

console.log('');
console.log('🔍 Comparison logic:');
console.log(`Field value: "${fieldValue}"`);
console.log(`Condition value: "${routeValue}"`);
console.log(`Operator: "${routeOperator}"`);

let matches = false;
switch (routeOperator) {
  case 'equals':
    matches = String(fieldValue).toLowerCase() === String(routeValue).toLowerCase();
    break;
  case 'contains':
    matches = String(fieldValue).toLowerCase().includes(String(routeValue).toLowerCase());
    break;
  case 'starts_with':
    matches = String(fieldValue).toLowerCase().startsWith(String(routeValue).toLowerCase());
    break;
  case 'ends_with':
    matches = String(fieldValue).toLowerCase().endsWith(String(routeValue).toLowerCase());
    break;
  default:
    matches = false;
}

console.log(`Should match: ${matches}`);
console.log('');

if (matches) {
  console.log('✅ ROUTING SHOULD WORK!');
  console.log('The field value matches the condition, so emails should be sent.');
} else {
  console.log('❌ ROUTING WILL FAIL!');
  console.log('The field value does not match the condition.');
}

console.log('');
console.log('📧 Now submitting to webhook...');
console.log('');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Webhook response:', data);
  console.log('');
  console.log('📋 Check your email inbox for:');
  console.log('- atownsend@hbiin.com (conditional routing)');
  console.log('- aarontownsend6@gmail.com (fallback)');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
