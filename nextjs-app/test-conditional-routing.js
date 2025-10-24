// Test script for conditional routing diagnostics
// Run this in your browser console or Node.js to test the routing

console.log('🔍 Conditional Routing Test Script');
console.log('==================================');

// Test the debug endpoint
async function testNotificationRouting(formId, testData) {
  console.log('📧 Testing notification routing...');
  console.log('Form ID:', formId);
  console.log('Test Data:', testData);
  
  try {
    const response = await fetch(`/api/debug/notifications/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testData })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Debug test successful');
      console.log('Form:', result.form);
      console.log('Settings:', result.notificationSettings);
      console.log('Route Tests:', result.routeTests);
      console.log('Result:', result.result);
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('💡 Suggestions:');
        result.suggestions.forEach(suggestion => console.log('  -', suggestion));
      }
    } else {
      console.error('❌ Debug test failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test a real webhook submission
async function testWebhookSubmission(testData) {
  console.log('📨 Testing webhook submission...');
  console.log('Test Data:', testData);
  
  try {
    const response = await fetch('/api/submissions/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('✅ Webhook response:', result);
    return result;
  } catch (error) {
    console.error('❌ Webhook error:', error);
  }
}

// Example usage:
console.log('');
console.log('📋 Usage Examples:');
console.log('');

console.log('1. Test notification routing for a form:');
console.log('   testNotificationRouting("123", { "country": "USA", "name": "John" });');
console.log('');

console.log('2. Test webhook submission:');
console.log('   testWebhookSubmission({');
console.log('     formId: "wf-form-contact",');
console.log('     siteId: "your-site-id",');
console.log('     data: { country: "USA", name: "John" }');
console.log('   });');
console.log('');

console.log('3. Check server logs in your terminal for detailed diagnostic output');
console.log('   Look for [Email] 🔍 DIAGNOSTIC messages');
console.log('');

// Make functions available globally
window.testNotificationRouting = testNotificationRouting;
window.testWebhookSubmission = testWebhookSubmission;

console.log('✅ Functions loaded: testNotificationRouting(), testWebhookSubmission()');
console.log('✅ Check your server terminal for detailed diagnostic logs');
