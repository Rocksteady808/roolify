// Test SendGrid configuration
console.log('🔍 Testing SendGrid Configuration');
console.log('=================================');
console.log('');

console.log('📋 Checking SendGrid API configuration...');
console.log('');

// Test the SendGrid direct endpoint
const testEmail = {
  to: 'aarontownsend6@gmail.com',
  subject: 'Test Email from SendGrid Direct API',
  htmlBody: '<h1>Test Email</h1><p>This is a test email to verify SendGrid configuration.</p>',
  textBody: 'Test Email - This is a test email to verify SendGrid configuration.',
  fromEmail: 'aaront@flexflowweb.com',
  fromName: 'Form Notifications'
};

console.log('📧 Sending test email...');
console.log('To:', testEmail.to);
console.log('Subject:', testEmail.subject);
console.log('From:', testEmail.fromEmail);
console.log('');

fetch('http://localhost:1337/api/sendgrid/direct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testEmail)
})
.then(res => res.json())
.then(data => {
  console.log('✅ SendGrid response:', data);
  console.log('');
  
  if (data.error) {
    console.log('❌ SendGrid Error:', data.error);
    console.log('');
    console.log('🔧 Possible fixes:');
    console.log('1. Check if SENDGRID_API_KEY is set in .env.local');
    console.log('2. Check if SendGrid API key is valid');
    console.log('3. Check if SendGrid account is active');
    console.log('4. Check if sender email is verified in SendGrid');
    console.log('');
    console.log('💡 To check environment variables:');
    console.log('1. Look for .env.local file in the project root');
    console.log('2. Check if SENDGRID_API_KEY is set');
    console.log('3. Restart the server after adding the key');
  } else {
    console.log('✅ SendGrid API is working!');
    console.log('');
    console.log('📧 Check your email inbox:');
    console.log('- aarontownsend6@gmail.com');
    console.log('- Check spam folder');
    console.log('- Check SendGrid dashboard for delivery status');
    console.log('');
    console.log('🔍 If you received the test email:');
    console.log('- SendGrid is working correctly');
    console.log('- The issue is in the form submission email processing');
    console.log('- Check server logs for email processing errors');
  }
})
.catch(err => {
  console.error('❌ Error testing SendGrid:', err.message);
  console.log('');
  console.log('🔧 Possible issues:');
  console.log('1. Server not running');
  console.log('2. SendGrid endpoint not accessible');
  console.log('3. Network connectivity issues');
});
