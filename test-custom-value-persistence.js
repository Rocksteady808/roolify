// Test custom value persistence
console.log('🧪 Testing Custom Value Persistence');
console.log('===================================');
console.log('');

console.log('📋 Testing custom value save and load...');
console.log('');

// Test 1: Check current notification settings
console.log('📧 Test 1: Checking current notification settings...');
fetch('http://localhost:1337/api/notifications?formId=23')
  .then(res => res.json())
  .then(settings => {
    console.log('✅ Current settings:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('');
    
    if (settings && settings.custom_value) {
      console.log('📊 Custom value found:', settings.custom_value);
    } else {
      console.log('❌ No custom value found in settings');
    }
    
    console.log('');
    console.log('🔍 Expected behavior:');
    console.log('1. Go to http://localhost:1337/notifications');
    console.log('2. Select the form');
    console.log('3. Set a custom value (e.g., "I have read the info for {{field}}")');
    console.log('4. Save the settings');
    console.log('5. Refresh the page');
    console.log('6. Select the form again');
    console.log('7. Check if the custom value field is populated');
    console.log('');
    
    console.log('🐛 If custom value is not persisting:');
    console.log('1. Check if the value is being saved to the database');
    console.log('2. Check if the value is being loaded from the database');
    console.log('3. Check if the value is being displayed in the UI');
    console.log('4. Check for any JavaScript errors in the browser console');
    console.log('');
    
    console.log('🔧 Debugging steps:');
    console.log('1. Open browser developer tools');
    console.log('2. Go to http://localhost:1337/notifications');
    console.log('3. Select the form');
    console.log('4. Set a custom value and save');
    console.log('5. Check the Network tab for the save request');
    console.log('6. Check the response to see if custom_value is included');
    console.log('7. Refresh the page and check the load request');
    console.log('8. Check if custom_value is in the response');
  })
  .catch(err => {
    console.error('❌ Error checking settings:', err.message);
  });
