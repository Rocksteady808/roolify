// Test checkbox detection logic
console.log('🧪 Testing Checkbox Detection Logic');
console.log('==================================');
console.log('');

console.log('🔍 Testing if checkbox detection is working...');

// Test the checkbox detection logic
const testValues = [
  { value: "on", expected: "checkbox" },
  { value: "off", expected: "checkbox" },
  { value: "true", expected: "checkbox" },
  { value: "false", expected: "checkbox" },
  { value: "Aaron", expected: "not checkbox" },
  { value: "Yes", expected: "not checkbox" }
];

console.log('📊 Testing checkbox detection:');
testValues.forEach(({ value, expected }) => {
  const isCheckbox = (value === 'true' || value === true || value === 'on' || value === 'off' || value === 'false' || value === false);
  const isChecked = (value === 'true' || value === true || value === 'on');
  
  console.log(`Value: "${value}" → isCheckbox: ${isCheckbox}, isChecked: ${isChecked} (expected: ${expected})`);
});

console.log('');
console.log('🔍 The issue might be:');
console.log('1. Checkbox detection logic is wrong');
console.log('2. Custom value is not being passed to replaceTemplateVariables');
console.log('3. Custom value application logic is wrong');
console.log('4. Server logs are not showing the custom value application');
console.log('');

console.log('💡 To debug this:');
console.log('1. Check server console for [Email] 📧 Custom value available: true/false');
console.log('2. Check server console for [Email] Using custom value "..." for checkbox field "..."');
console.log('3. If you don\'t see these logs, the custom value is not being applied');
console.log('4. If you see the logs but still get "on", the custom value replacement is not working');
console.log('');

console.log('🔧 Let me submit a form to see the server logs...');

const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Form submission response:', data);
  console.log('');
  
  console.log('🔍 Now check your server console for:');
  console.log('1. [Email] 📧 Custom value available: true/false');
  console.log('2. [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
  console.log('3. [Email] Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
  console.log('');
  
  console.log('🐛 If you don\'t see these logs:');
  console.log('- Custom value is not being passed to email generation');
  console.log('- There\'s an issue in the sendNotificationEmails function');
  console.log('- Custom value is null/undefined when passed to replaceTemplateVariables');
});
