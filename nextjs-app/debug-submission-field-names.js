// Debug what field names are actually used in form submissions
console.log('🔍 Debugging Submission Field Names');
console.log('==================================');
console.log('');

// Test submission to see what field names are actually used
const testData = {
  "Has Account": "Yes",
  "HBI Account Rep": "Aaron", 
  "EIN Number": "123456789",
  "Full Name": "Test User",
  "Company Name": "Test Company",
  "Email": "test@example.com",
  "Select Country": "United States",
  "Message Inquiry": "Testing field names",
  "Privacy Policy": "on",
  "Terms Of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📋 Field names in test submission:');
Object.keys(testData).forEach(key => {
  if (key !== 'formId' && key !== 'formName' && key !== 'siteId') {
    console.log(`  - "${key}": "${testData[key]}"`);
  }
});

console.log('');
console.log('🎯 The issue is likely that the field names in the UI don\'t match the field names in submissions!');
console.log('');
console.log('📋 Expected checkbox fields:');
console.log('  - "Privacy Policy"');
console.log('  - "Terms Of Service"');
console.log('');
console.log('🔧 The per-field custom values UI should show these exact field names.');
