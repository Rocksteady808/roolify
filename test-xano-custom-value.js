// Test Xano API directly with custom_value
console.log('🧪 Testing Xano API with Custom Value');
console.log('=====================================');
console.log('');

console.log('📧 Testing Xano API directly...');

// Test the Xano API directly
const xanoData = {
  admin_routes: JSON.stringify([
    {
      field: "HBI Account Rep",
      operator: "equals",
      value: "Aaron",
      recipients: "atownsend@hbiin.com"
    }
  ]),
  user_routes: JSON.stringify([]),
  admin_fallback_email: "aarontownsend6@gmail.com",
  user_fallback_email: "",
  custom_value: "I have read the info for {{field}}",  // Test custom value
  email_template: null,
  admin_subject: "New Contact Form Submission",
  user_subject: "Thank you for your submission"
};

console.log('📊 Xano API payload:');
console.log(JSON.stringify(xanoData, null, 2));
console.log('');

console.log('🔍 This test will help us determine if:');
console.log('1. The Xano database has a custom_value column');
console.log('2. The Xano API accepts custom_value field');
console.log('3. The Xano API returns custom_value in response');
console.log('');

console.log('💡 To test this manually:');
console.log('1. Go to your Xano dashboard');
console.log('2. Check the notification_setting table schema');
console.log('3. Look for a custom_value column');
console.log('4. If missing, add it as a text field');
console.log('5. Test the API again');
console.log('');

console.log('🔧 Alternative: Check server logs for Xano API errors');
console.log('Look for any errors when the update request is sent to Xano');
