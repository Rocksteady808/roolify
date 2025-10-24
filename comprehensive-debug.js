// Comprehensive debugging for conditional routing
console.log('🔍 Comprehensive Conditional Routing Debug');
console.log('==========================================');
console.log('');

console.log('📋 Current Status:');
console.log('- Test submissions work ✅');
console.log('- Real form submissions don\'t work ❌');
console.log('- Multiple form IDs exist in system');
console.log('');

console.log('🔍 Debugging Steps:');
console.log('');

console.log('1. 📝 Check Real Form Data:');
console.log('   - Submit the real form on your website');
console.log('   - Open browser developer tools (F12)');
console.log('   - Go to Network tab');
console.log('   - Look for the POST request to your webhook');
console.log('   - Copy the exact request payload');
console.log('   - Compare with our test data below');
console.log('');

console.log('2. 📝 Our Test Data (that works):');
const testData = {
  "Full Name": "John Doe",
  "Email": "john@example.com", 
  "HBI Account Rep": "Aaron",
  "Company Name": "Test Company",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
};
console.log(JSON.stringify(testData, null, 2));
console.log('');

console.log('3. 📧 Check Server Logs:');
console.log('   - Watch the server console when you submit the real form');
console.log('   - Look for these specific log messages:');
console.log('     • "[Email] 🔍 RAW SETTINGS FROM XANO: {...}"');
console.log('     • "[Email] 🔍 Processing X admin routes"');
console.log('     • "[Email] 🔍 Checking route: {...}"');
console.log('     • "[Email] 🔍 Comparing: {...}"');
console.log('     • "[Email] 🔍 Route matches: true/false"');
console.log('     • "[Email] ✅ Admin route matched"');
console.log('     • "[Email] Sending to X admin recipient(s)"');
console.log('');

console.log('4. 🐛 Common Issues to Check:');
console.log('   a) Form ID mismatch:');
console.log('      - Real form might use different formId');
console.log('      - Check if formId in real submission matches our test');
console.log('   b) Field name mismatch:');
console.log('      - Real form field name might be different');
console.log('      - Check for extra spaces, different casing, etc.');
console.log('   c) Field value mismatch:');
console.log('      - Real form value might be different');
console.log('      - Check for extra spaces, different text, etc.');
console.log('   d) Notification settings not found:');
console.log('      - Check if settings exist for the formId');
console.log('      - Check if the formId mapping is correct');
console.log('');

console.log('5. 🔧 Quick Tests to Run:');
console.log('   a) Test with exact same data as real form:');
console.log('      - Copy the exact data from real form submission');
console.log('      - Update our test script with that data');
console.log('      - Run the test to see if it works');
console.log('   b) Test with different formId:');
console.log('      - Try formId: 23 (our current test)');
console.log('      - Try formId: 68 (also has settings)');
console.log('      - Try the HTML form ID from real submission');
console.log('   c) Test field name variations:');
console.log('      - Try exact field name from real form');
console.log('      - Try with/without extra spaces');
console.log('      - Try different casing');
console.log('');

console.log('6. 📊 Current Notification Settings:');
console.log('   - Form ID 23: Has settings with "HBI Account Rep" = "Aaron"');
console.log('   - Form ID 68: Has settings with "HBI Account Rep" = "Aaron"');
console.log('   - Both should work if the formId matches');
console.log('');

console.log('💡 Next Steps:');
console.log('1. Submit the real form and capture the exact data');
console.log('2. Compare with our test data');
console.log('3. Identify the differences');
console.log('4. Update our test with the real data');
console.log('5. Run the test to confirm it works');
console.log('6. Fix the routing logic if needed');
console.log('');

console.log('🔧 If you find the differences, I can help fix the routing logic!');
