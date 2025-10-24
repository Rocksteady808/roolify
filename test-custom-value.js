// Test custom value feature for checkboxes
const testData = {
  "Full Name": "Test User",
  "Email": "test@example.com",
  "Privacy Policy": "on",  // Checkbox checked
  "Terms Of Service": "on", // Checkbox checked
  "Newsletter": "off",      // Checkbox unchecked
  "formId": "wf-form-Test-Form",
  "formName": "Test Form",
  "siteId": "test-site-123",
  "pageUrl": "https://example.com/test",
  "pageTitle": "Test Page"
};

console.log('Testing custom value feature...');
console.log('Form data:', JSON.stringify(testData, null, 2));
console.log('\nSending test submission with custom value...');

fetch('http://localhost:1337/api/submissions/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('\n✅ Response:', data);
  console.log('\nCheck your email to see if the custom value appears for checked checkboxes!');
})
.catch(err => {
  console.error('\n❌ Error:', err.message);
});
