// Debug field names to see what's being used
console.log('🔍 Debugging Field Names');
console.log('========================');
console.log('');

// Get the forms to see what field names are available
fetch('http://localhost:1337/api/forms/with-real-options?siteId=68eb5d6db0e34d2e3ed12c0a')
.then(res => res.json())
.then(data => {
  console.log('📋 API Response:', JSON.stringify(data, null, 2));
  
  if (Array.isArray(data)) {
    console.log('📋 Available forms:');
    data.forEach(form => {
      console.log(`Form: ${form.name} (ID: ${form.id})`);
      if (form.fields) {
        console.log('  Fields:');
        form.fields.forEach(field => {
          const fieldName = field.id || field.name || '';
          console.log(`    - ${fieldName} (type: ${field.type || 'unknown'})`);
        });
      }
      console.log('');
    });
  } else {
    console.log('📋 Data structure:', typeof data, Object.keys(data));
  }
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
