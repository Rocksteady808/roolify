// Debug checkbox custom value issue
console.log('🔍 Debugging Checkbox Custom Value Issue');
console.log('========================================');
console.log('');

console.log('🐛 The Issue:');
console.log('- Privacy Policy still shows "on" instead of custom value');
console.log('- This means checkbox custom value logic is not working');
console.log('');

console.log('🔍 Let me test with a simple checkbox field...');

// Test with just checkbox fields
const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

console.log('📊 Test data (checkbox fields only):');
console.log(JSON.stringify(testData, null, 2));
console.log('');

console.log('🔧 Expected behavior:');
console.log('- Privacy Policy: "on" → should become custom value');
console.log('- Terms of Service: "on" → should become custom value');
console.log('');

console.log('📧 Submitting test data...');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Check server console for:');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('- [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  
  console.log('🐛 If you don\'t see these logs:');
  console.log('1. Custom value is not being loaded from database');
  console.log('2. Custom value is null/undefined');
  console.log('3. Checkbox detection logic is wrong');
  console.log('4. Custom value application logic is wrong');
  console.log('');
  
  console.log('🔧 Debugging steps:');
  console.log('1. Check if custom value is loaded: [Email] 📧 Custom value available: true/false');
  console.log('2. Check if custom value is passed: [Email] Using custom value "..." for checkbox field "..."');
  console.log('3. Check if checkbox detection works: isCheckbox should be true for "on" values');
  console.log('4. Check if isChecked works: isChecked should be true for "on" values');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
