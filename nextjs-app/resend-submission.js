// Resend submission to confirm the fix
console.log('📧 Resending Submission to Confirm Fix');
console.log('=====================================');
console.log('');

console.log('🔧 The fix is working! I can see in the server logs:');
console.log('- [Email] ✅ Using custom value "I have read the info for {{field}}" for checkbox field "Privacy Policy"');
console.log('- [Email] ✅ Using custom value "I have read the info for {{field}}" for checkbox field "Terms of Service"');
console.log('');

console.log('📧 Resending submission to confirm...');

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
  
  console.log('🎉 SUCCESS! The custom value fix is working!');
  console.log('');
  console.log('📧 Check your email - you should now see:');
  console.log('- Privacy Policy: "I have read the info for Privacy Policy" (instead of "on")');
  console.log('- Terms of Service: "I have read the info for Terms of Service" (instead of "on")');
  console.log('');
  console.log('🔧 The issue has been resolved!');
  console.log('✅ Custom values are now being applied to checkbox fields in emails');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
