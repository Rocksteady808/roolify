// Debug per-field custom values
console.log('🔍 Debugging Per-Field Custom Values');
console.log('===================================');
console.log('');

// Test the notifications API to see current settings
fetch('http://localhost:1337/api/notifications?formId=68eb5d8e93a70150aa597336')
.then(res => res.json())
.then(settings => {
  console.log('📋 Current notification settings:');
  console.log('Custom Value:', settings.custom_value);
  console.log('Field Custom Values:', settings.field_custom_values);
  console.log('');
  
  if (settings.field_custom_values) {
    console.log('✅ Per-field custom values found:');
    Object.entries(settings.field_custom_values).forEach(([field, value]) => {
      console.log(`  - ${field}: "${value}"`);
    });
  } else {
    console.log('❌ No per-field custom values found');
    console.log('💡 This means the UI needs to be used to set per-field values');
  }
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
