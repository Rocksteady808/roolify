// Debug what the UI is receiving when loading notification settings
console.log('🔍 Debugging UI Loading');
console.log('======================');
console.log('');

// Fetch notification settings for your form
fetch('http://localhost:1337/api/notifications?formId=68eb5d8e93a70150aa597336')
.then(res => res.json())
.then(data => {
  console.log('📧 Notification settings response:');
  console.log('');
  console.log('custom_value:', data.custom_value);
  console.log('field_custom_values:', JSON.stringify(data.field_custom_values, null, 2));
  console.log('');
  
  if (data.field_custom_values) {
    console.log('✅ Per-field custom values are loaded correctly!');
    console.log('');
    Object.entries(data.field_custom_values).forEach(([field, value]) => {
      console.log(`  - ${field}: "${value}"`);
    });
  } else {
    console.log('❌ Per-field custom values are null or missing!');
  }
  
  console.log('');
  console.log('🔍 When you load the notifications page in your browser:');
  console.log('1. Open the browser console (F12)');
  console.log('2. Look for "[Notifications] Loaded and mapped settings successfully"');
  console.log('3. Check if the fieldCustomValues state is set correctly');
  console.log('');
  console.log('If both fields show the same text, it might be a React rendering issue.');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
