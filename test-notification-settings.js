// Test notification settings for the form
console.log('🔍 Testing Notification Settings');
console.log('================================');
console.log('');

// Test 1: Check notification settings for the form
const formId = 23; // From the previous test response
console.log(`📧 Test 1: Checking notification settings for form ID: ${formId}`);
console.log('');

fetch(`http://localhost:1337/api/notifications?formId=${formId}`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Notification settings response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data && Object.keys(data).length > 0) {
      console.log('📋 Settings found:');
      console.log(`- Admin routes: ${data.admin_routes ? 'YES' : 'NO'}`);
      console.log(`- Admin fallback: ${data.admin_fallback_email || 'NONE'}`);
      console.log(`- Custom template: ${data.email_template ? 'YES' : 'NO'}`);
      console.log(`- Custom value: ${data.custom_value || 'NONE'}`);
      
      if (data.admin_routes && Array.isArray(data.admin_routes)) {
        console.log('');
        console.log('🔍 Admin routes details:');
        data.admin_routes.forEach((route, index) => {
          console.log(`  Route ${index + 1}:`);
          console.log(`    Field: ${route.field}`);
          console.log(`    Operator: ${route.operator}`);
          console.log(`    Value: ${route.value}`);
          console.log(`    Recipients: ${route.recipients}`);
        });
      }
    } else {
      console.log('❌ No notification settings found for this form');
      console.log('');
      console.log('💡 This means:');
      console.log('1. No conditional routing is configured');
      console.log('2. No fallback email is set');
      console.log('3. No emails will be sent');
      console.log('');
      console.log('🔧 To fix this:');
      console.log('1. Go to http://localhost:1337/notifications');
      console.log('2. Select the form');
      console.log('3. Configure admin routes or fallback email');
      console.log('4. Save settings');
    }
  })
  .catch(err => {
    console.error('❌ Error checking notification settings:', err.message);
  });
