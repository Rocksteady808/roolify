// Debug real form submission vs test submission
console.log('🔍 Debugging Real Form Submission');
console.log('==================================');
console.log('');

console.log('📋 The Issue:');
console.log('- Test submission works ✅');
console.log('- Real form submission doesn\'t work ❌');
console.log('- This means there\'s a mismatch in the data');
console.log('');

console.log('🔍 What to check when you submit the real form:');
console.log('');

console.log('1. 📝 Form Field Names:');
console.log('   - Open browser developer tools (F12)');
console.log('   - Go to Network tab');
console.log('   - Submit the form');
console.log('   - Look for the POST request to your webhook');
console.log('   - Check the request payload');
console.log('   - Compare field names with our test data');
console.log('');

console.log('2. 📝 Form Field Values:');
console.log('   - Check if "HBI Account Rep" field has the value "Aaron"');
console.log('   - Look for any extra spaces, characters, or different text');
console.log('   - Check if the field name is exactly "HBI Account Rep"');
console.log('');

console.log('3. 📧 Server Logs:');
console.log('   - Watch the server console when you submit');
console.log('   - Look for "[Email] 🔍 Processing X admin routes"');
console.log('   - Look for "[Email] 🔍 Comparing: {...}"');
console.log('   - Look for "[Email] 🔍 Route matches: true/false"');
console.log('   - Check if the field matching is working');
console.log('');

console.log('4. 🐛 Common Mismatches:');
console.log('   - Field name: "HBI Account Rep" vs "HBI Account Rep " (extra space)');
console.log('   - Field name: "HBI Account Rep" vs "HBI Account Rep:" (with colon)');
console.log('   - Field value: "Aaron" vs "Aaron " (extra space)');
console.log('   - Field value: "Aaron" vs "Aaron:" (with colon)');
console.log('   - Field value: "Aaron" vs "aaron" (different casing)');
console.log('   - Field value: "Aaron" vs "Aaron -" (with dash)');
console.log('');

console.log('5. 🔧 Quick Test:');
console.log('   - Submit the real form');
console.log('   - Copy the exact field names and values from the network request');
console.log('   - Update our test script with the real data');
console.log('   - Run the test again to see if it works');
console.log('');

console.log('📊 Our test data (that works):');
console.log(JSON.stringify({
  "Full Name": "John Doe",
  "Email": "john@example.com", 
  "HBI Account Rep": "Aaron",
  "Company Name": "Test Company",
  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
  "formName": "HBI International Inquiry Form - HBI International",
  "siteId": "68bc42f58e22a62ce5c282e0"
}, null, 2));
console.log('');

console.log('💡 Next steps:');
console.log('1. Submit the real form and capture the exact data');
console.log('2. Compare with our test data');
console.log('3. Identify the differences');
console.log('4. Fix the routing logic or form data');
