// Test different field name variations that might occur in real forms
console.log('🧪 Testing Field Name Variations');
console.log('================================');
console.log('');

// Test different possible field name variations
const testVariations = [
  {
    name: 'Exact match (our test)',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "HBI Account Rep": "Aaron",
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  },
  {
    name: 'Extra space in field name',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "HBI Account Rep ": "Aaron",  // Extra space
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  },
  {
    name: 'Extra space in field value',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "HBI Account Rep": "Aaron ",  // Extra space in value
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  },
  {
    name: 'Different casing in field name',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "hbi account rep": "Aaron",  // Lowercase
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  },
  {
    name: 'Different casing in field value',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "HBI Account Rep": "aaron",  // Lowercase value
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  },
  {
    name: 'Field name with colon',
    data: {
      "Full Name": "John Doe",
      "Email": "john@example.com", 
      "HBI Account Rep:": "Aaron",  // With colon
      "Company Name": "Test Company",
      "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
      "formName": "HBI International Inquiry Form - HBI International",
      "siteId": "68bc42f58e22a62ce5c282e0"
    }
  }
];

console.log('📧 Testing each variation...');
console.log('');

let testIndex = 0;
function runNextTest() {
  if (testIndex >= testVariations.length) {
    console.log('✅ All tests completed!');
    console.log('');
    console.log('🔍 What to look for:');
    console.log('1. Which variations work vs don\'t work');
    console.log('2. Check server logs for field matching');
    console.log('3. Compare with your real form submission data');
    return;
  }
  
  const test = testVariations[testIndex];
  console.log(`📋 Test ${testIndex + 1}: ${test.name}`);
  console.log('Data:', JSON.stringify(test.data, null, 2));
  console.log('');
  
  fetch('http://localhost:1337/api/submissions/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(test.data)
  })
  .then(res => res.json())
  .then(data => {
    console.log(`✅ Response: ${data.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Submission ID: ${data.submissionId}`);
    console.log('');
    console.log('📋 Check server logs for:');
    console.log('- [Email] 🔍 Processing X admin routes');
    console.log('- [Email] 🔍 Comparing: {...}');
    console.log('- [Email] 🔍 Route matches: true/false');
    console.log('- [Email] ✅ Admin route matched');
    console.log('');
    
    testIndex++;
    setTimeout(runNextTest, 2000); // Wait 2 seconds between tests
  })
  .catch(err => {
    console.error(`❌ Error in test ${testIndex + 1}:`, err.message);
    testIndex++;
    setTimeout(runNextTest, 2000);
  });
}

runNextTest();
