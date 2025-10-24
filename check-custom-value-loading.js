// Check if custom value is being loaded from database
console.log('🔍 Checking Custom Value Loading');
console.log('================================');
console.log('');

console.log('📧 Testing if custom value is loaded from database...');

// First, check what's in the database
fetch('http://localhost:1337/api/notifications?formId=23')
  .then(res => res.json())
  .then(settings => {
    console.log('✅ Current notification settings:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('');
    
    if (settings && settings.custom_value) {
      console.log('✅ Custom value found in database:', settings.custom_value);
      console.log('');
      
      console.log('🔍 Now testing form submission...');
      
      // Test with checkbox fields
      const testData = {
        "Privacy Policy": "on",
        "Terms of Service": "on",
        "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
        "formName": "HBI International Inquiry Form - HBI International",
        "siteId": "68bc42f58e22a62ce5c282e0"
      };
      
      return fetch('http://localhost:1337/api/submissions/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
    } else {
      console.log('❌ No custom value found in database');
      console.log('🔧 This explains why checkbox fields are not getting custom values');
      console.log('');
      console.log('💡 To fix this:');
      console.log('1. Go to http://localhost:1337/notifications');
      console.log('2. Select the form');
      console.log('3. Set a custom value');
      console.log('4. Save the settings');
      console.log('5. Test again');
    }
  })
  .then(res => res ? res.json() : null)
  .then(data => {
    if (data) {
      console.log('✅ Form submission response:', data);
      console.log('');
      
      console.log('🔍 Check server console for:');
      console.log('- [Email] 📧 Custom value available: true/false');
      console.log('- [Email] Using custom value "..." for checkbox field "..."');
      console.log('');
      
      console.log('🐛 If you don\'t see custom value logs:');
      console.log('1. Custom value is not being passed to email generation');
      console.log('2. Checkbox detection logic is wrong');
      console.log('3. Custom value application logic is wrong');
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
