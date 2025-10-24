// Test template generation for different forms
console.log('🧪 Testing HTML Template Generation');
console.log('=====================================');
console.log('');

// Test 1: Check if forms are loaded with correct field structure
console.log('📋 Test 1: Checking form field structure...');
console.log('');

fetch('http://localhost:1337/api/forms/with-real-options?siteId=68bc42f58e22a62ce5c282e0')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Forms loaded successfully!');
    console.log(`📊 Found ${data.forms?.length || 0} forms`);
    
    if (data.forms && data.forms.length > 0) {
      console.log('');
      console.log('🔍 Form Details:');
      data.forms.forEach((form, index) => {
        console.log(`📋 Form ${index + 1}: "${form.name}"`);
        console.log(`   - Fields: ${form.fields?.length || 0}`);
        if (form.fields && form.fields.length > 0) {
          console.log('   - Field names:');
          form.fields.forEach(field => {
            console.log(`     • ${field.displayName || field.name} (${field.type})`);
          });
        }
        console.log('');
      });
      
      console.log('💡 Next steps:');
      console.log('1. Go to http://localhost:1337/notifications');
      console.log('2. Select a form from the dropdown');
      console.log('3. Check the HTML template editor');
      console.log('4. Verify all form fields are included in the template');
      console.log('5. Look for console logs showing field generation');
    }
  })
  .catch(err => {
    console.error('❌ Error loading forms:', err.message);
  });
