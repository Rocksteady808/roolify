// Debug actual form submission
console.log('🔍 Debugging Actual Form Submission');
console.log('===================================');
console.log('');

console.log('📋 When you fill out the actual form, check these things:');
console.log('');

console.log('1. 📝 Form Field Names:');
console.log('   - Make sure the field is named exactly "HBI Account Rep"');
console.log('   - Check if there are any extra spaces or characters');
console.log('   - Look at the HTML source of the form');
console.log('');

console.log('2. 📝 Form Field Values:');
console.log('   - Make sure you select exactly "Aaron" from the dropdown');
console.log('   - Check if the value is "Aaron" or something else');
console.log('   - Look at the browser developer tools Network tab');
console.log('');

console.log('3. 📧 Server Logs:');
console.log('   - Watch the server console when you submit');
console.log('   - Look for "[Email] 🔍 Processing X admin routes"');
console.log('   - Look for "[Email] 🔍 Comparing: {...}"');
console.log('   - Look for "[Email] 🔍 Route matches: true/false"');
console.log('');

console.log('4. 📧 Email Delivery:');
console.log('   - Check atownsend@hbiin.com inbox');
console.log('   - Check aarontownsend6@gmail.com inbox');
console.log('   - Check spam folders');
console.log('   - Check SendGrid dashboard');
console.log('');

console.log('5. 🐛 Common Issues:');
console.log('   - Field name mismatch (extra spaces, different casing)');
console.log('   - Value mismatch (different text, extra characters)');
console.log('   - Email delivery issues (spam, invalid addresses)');
console.log('   - SendGrid API issues (rate limits, authentication)');
console.log('');

console.log('🔧 To test the exact form data:');
console.log('1. Fill out the form on your website');
console.log('2. Open browser developer tools');
console.log('3. Go to Network tab');
console.log('4. Submit the form');
console.log('5. Look for the POST request to your webhook');
console.log('6. Check the request payload');
console.log('7. Compare with our test data above');
console.log('');

console.log('📊 Expected form data structure:');
console.log('{');
console.log('  "Full Name": "Your Name",');
console.log('  "Email": "your@email.com",');
console.log('  "HBI Account Rep": "Aaron",  // ← This should match exactly');
console.log('  "Company Name": "Your Company",');
console.log('  "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",');
console.log('  "formName": "HBI International Inquiry Form - HBI International",');
console.log('  "siteId": "68bc42f58e22a62ce5c282e0",');
console.log('  "pageUrl": "https://your-site.com/page",');
console.log('  "pageTitle": "Your Page Title"');
console.log('}');
console.log('');

console.log('✅ If everything matches, the conditional routing should work!');
console.log('❌ If something is different, that explains why it\'s not working.');
