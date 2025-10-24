// Test conditional routing settings persistence
console.log('🧪 Testing Conditional Routing Persistence');
console.log('==========================================');
console.log('');

// Test 1: Check current notification settings
console.log('📋 Test 1: Checking current notification settings...');
fetch('http://localhost:1337/api/notifications?formId=23')
  .then(res => res.json())
  .then(settings => {
    console.log('✅ Current settings:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('');
    
    if (settings && settings.admin_routes && settings.admin_routes.length > 0) {
      console.log('📊 Admin routes found:');
      settings.admin_routes.forEach((route, i) => {
        console.log(`  Route ${i+1}:`);
        console.log(`    Field: "${route.field}"`);
        console.log(`    Value: "${route.value}"`);
        console.log(`    Recipients: "${route.recipients}"`);
      });
      console.log('');
      
      console.log('🔍 Expected behavior:');
      console.log('1. Go to http://localhost:1337/notifications');
      console.log('2. Select the form');
      console.log('3. Check if the field is pre-selected in the dropdown');
      console.log('4. Check if the value is pre-filled');
      console.log('5. Check if the recipient email is pre-filled');
      console.log('6. Refresh the page and verify settings persist');
      console.log('');
      
      console.log('🐛 If settings are not persisting:');
      console.log('1. Check browser console for field mapping logs');
      console.log('2. Look for "[Notifications] 🔍 Mapping route field name to ID"');
      console.log('3. Look for "[Notifications] 🔍 Admin routing state updated"');
      console.log('4. Check if field names match between saved data and available fields');
      console.log('');
      
      console.log('🔧 Debugging steps:');
      console.log('1. Open browser developer tools');
      console.log('2. Go to http://localhost:1337/notifications');
      console.log('3. Select the form');
      console.log('4. Watch console logs for field mapping');
      console.log('5. Check if the dropdown shows the correct selected field');
    } else {
      console.log('❌ No admin routes found in settings');
      console.log('');
      console.log('💡 To test conditional routing:');
      console.log('1. Go to http://localhost:1337/notifications');
      console.log('2. Select a form');
      console.log('3. Configure conditional routing');
      console.log('4. Save settings');
      console.log('5. Refresh the page');
      console.log('6. Check if settings persist');
    }
  })
  .catch(err => {
    console.error('❌ Error checking settings:', err.message);
  });
