// Debug form ID mapping issue
console.log('🔍 Debugging Form ID Mapping');
console.log('============================');
console.log('');

console.log('📋 The Issue:');
console.log('- Test submission uses formId: 23 (numeric)');
console.log('- Real form might use different formId');
console.log('- Notification settings are mapped by formId');
console.log('');

console.log('🔍 Let\'s check the form ID mapping:');
console.log('');

// Check what form IDs exist in the system
fetch('http://localhost:1337/api/notifications')
  .then(res => res.json())
  .then(allSettings => {
    console.log('📊 All notification settings in system:');
    if (Array.isArray(allSettings)) {
      allSettings.forEach((setting, index) => {
        console.log(`  Setting ${index + 1}:`);
        console.log(`    ID: ${setting.id}`);
        console.log(`    Form ID: ${setting.form}`);
        console.log(`    Admin routes: ${setting.admin_routes?.length || 0}`);
        if (setting.admin_routes && setting.admin_routes.length > 0) {
          setting.admin_routes.forEach((route, i) => {
            console.log(`      Route ${i + 1}: ${route.field} = "${route.value}" → ${route.recipients}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('No settings found or error:', allSettings);
    }
    
    console.log('🔍 Possible issues:');
    console.log('1. Real form uses different formId than our test');
    console.log('2. Form ID mapping is incorrect');
    console.log('3. Notification settings not found for the form');
    console.log('');
    
    console.log('💡 To debug:');
    console.log('1. Submit the real form');
    console.log('2. Check the server logs for the formId being used');
    console.log('3. Check if notification settings exist for that formId');
    console.log('4. Compare with our test formId (23)');
    console.log('');
    
    console.log('🔧 Quick fix test:');
    console.log('Try submitting with different formIds to see which one works:');
    console.log('- formId: 23 (our test)');
    console.log('- formId: "wf-form-HBI-International-Inquiry-Form---HBI-International" (HTML form ID)');
    console.log('- Check what the real form actually sends');
  })
  .catch(err => {
    console.error('❌ Error checking notification settings:', err.message);
  });
