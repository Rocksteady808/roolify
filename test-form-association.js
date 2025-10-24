#!/usr/bin/env node

/**
 * Test script to verify form association and notification routing
 * 
 * This script helps debug form ID association issues by:
 * 1. Checking what forms exist in Xano for a site
 * 2. Testing form submission with different ID formats
 * 3. Verifying notification settings are on the correct form
 * 4. Showing diagnostic information
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return { response, data, ok: response.ok };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { response: null, data: null, ok: false, error };
  }
}

async function testFormAssociation(siteId, formId) {
  console.log('🔍 Testing form association...');
  console.log('📍 Site ID:', siteId);
  console.log('📍 Form ID:', formId);
  console.log('');
  
  // Step 1: Check what forms exist for this site
  console.log('📋 Step 1: Checking forms in Xano...');
  const { data: formData, ok } = await makeRequest(`${BASE_URL}/api/debug/form-ids/${siteId}`);
  
  if (!ok || !formData) {
    console.log('❌ Failed to get form data:', formData);
    return;
  }
  
  console.log(`✅ Found ${formData.summary.totalForms} forms for site ${siteId}`);
  console.log(`📊 Forms with notifications: ${formData.summary.formsWithNotifications}`);
  console.log(`⚠️  Duplicate names: ${formData.summary.duplicateNames}`);
  console.log('');
  
  // Show all forms
  console.log('📝 All forms:');
  formData.forms.forEach(form => {
    const status = form.hasNotifications ? '🔔' : '🔕';
    const notificationInfo = form.hasNotifications 
      ? `(routes: ${form.notificationSettings.adminRoutesCount}, fallback: ${form.notificationSettings.hasFallbackEmail})`
      : '(no notifications)';
    console.log(`  ${status} ID: ${form.id} | Name: "${form.name}" | html_form_id: "${form.html_form_id}" ${notificationInfo}`);
  });
  console.log('');
  
  // Check for duplicates
  if (formData.duplicates.length > 0) {
    console.log('⚠️  DUPLICATE FORMS FOUND:');
    formData.duplicates.forEach(dup => {
      console.log(`  📝 "${dup.name}" (${dup.count} copies):`);
      dup.forms.forEach(form => {
        const status = form.hasNotifications ? '🔔' : '🔕';
        console.log(`    ${status} ID: ${form.id} | html_form_id: "${form.html_form_id}"`);
      });
    });
    console.log('');
  }
  
  // Step 2: Find the specific form
  console.log('🔍 Step 2: Looking for target form...');
  let targetForm = null;
  
  // Try to find by exact formId match
  targetForm = formData.forms.find(f => 
    String(f.id) === String(formId) || 
    f.html_form_id === formId ||
    f.name === formId
  );
  
  if (targetForm) {
    console.log(`✅ Found target form: ID ${targetForm.id} | Name: "${targetForm.name}" | html_form_id: "${targetForm.html_form_id}"`);
    console.log(`🔔 Has notifications: ${targetForm.hasNotifications ? 'YES' : 'NO'}`);
    
    if (targetForm.hasNotifications) {
      console.log(`📧 Fallback email: ${targetForm.notificationSettings.fallbackEmail}`);
      console.log(`🎯 Admin routes: ${targetForm.notificationSettings.adminRoutesCount}`);
    }
  } else {
    console.log(`❌ Form not found! Searched for: "${formId}"`);
    console.log('💡 Available forms:');
    formData.forms.forEach(f => console.log(`  - ID: ${f.id}, Name: "${f.name}", html_form_id: "${f.html_form_id}"`));
    return;
  }
  console.log('');
  
  // Step 3: Test form submission
  console.log('🧪 Step 3: Testing form submission...');
  
  const testSubmission = {
    formId: targetForm.html_form_id, // Use the html_form_id from Xano
    siteId: siteId,
    formName: targetForm.name,
    data: {
      'HBI Account Rep': 'Aaron',
      'Full Name': 'Test User',
      'Company Name': 'Test Company',
      'Email': 'test@example.com',
      'Select Country': 'USA'
    }
  };
  
  console.log('📤 Submitting test form with:');
  console.log(`  - htmlFormId: "${testSubmission.formId}"`);
  console.log(`  - siteId: "${testSubmission.siteId}"`);
  console.log(`  - formName: "${testSubmission.formName}"`);
  
  const { data: submissionResult } = await makeRequest(`${BASE_URL}/api/submissions/webhook`, {
    method: 'POST',
    body: JSON.stringify(testSubmission)
  });
  
  if (submissionResult && submissionResult.success) {
    console.log(`✅ Submission successful!`);
    console.log(`📝 Submission ID: ${submissionResult.submissionId}`);
    console.log(`🔗 Form ID: ${submissionResult.formId}`);
    console.log('');
    console.log('🔍 Check your server logs for diagnostic messages:');
    console.log('  - Look for "[Submission Webhook] 🔍 DIAGNOSTIC:" messages');
    console.log('  - Look for "[Email] 🔍 DIAGNOSTIC:" messages');
    console.log('  - Check if notification settings were found');
  } else {
    console.log(`❌ Submission failed:`, submissionResult);
  }
  console.log('');
  
  // Step 4: Recommendations
  console.log('💡 Step 4: Recommendations...');
  
  if (formData.recommendations.length > 0) {
    formData.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  if (!targetForm.hasNotifications) {
    console.log('  🔔 This form has no notification settings configured');
    console.log('  📝 Go to notifications page and configure settings for this form');
  } else {
    console.log('  ✅ Form has notification settings configured');
    console.log('  🔍 If notifications aren\'t working, check the diagnostic logs above');
  }
  
  if (formData.duplicates.length > 0) {
    console.log('  ⚠️  You have duplicate forms - consider cleaning them up');
    console.log('  🔧 Use the diagnostic endpoint to identify which forms to keep');
  }
  
  console.log('');
  console.log('🎯 Next steps:');
  console.log('  1. Check server logs for detailed diagnostic information');
  console.log('  2. Verify the html_form_id matches what form submissions send');
  console.log('  3. Test with a real form submission if needed');
  console.log('  4. Use the diagnostic endpoint to verify form associations');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node test-form-association.js <siteId> <formId>');
    console.log('');
    console.log('Examples:');
    console.log('  node test-form-association.js 652b10ed79cbf4ed07a349ed 53');
    console.log('  node test-form-association.js 652b10ed79cbf4ed07a349ed "68f648d669c38f6206830743"');
    console.log('  node test-form-association.js 652b10ed79cbf4ed07a349ed "wf-form-HBI-International-Inquiry-Form---HBI-International"');
    console.log('');
    console.log('💡 Use the diagnostic endpoint first to see available forms:');
    console.log(`   curl ${BASE_URL}/api/debug/form-ids/<siteId>`);
    process.exit(1);
  }
  
  const [siteId, formId] = args;
  
  console.log('🚀 Form Association Test Script');
  console.log('===============================');
  console.log('');
  
  await testFormAssociation(siteId, formId);
  
  console.log('✅ Test complete!');
}

// Handle both Node.js and browser environments
if (typeof window === 'undefined') {
  // Node.js environment
  main().catch(console.error);
} else {
  // Browser environment - export for use in console
  window.testFormAssociation = testFormAssociation;
  console.log('📝 Form association test functions loaded!');
  console.log('Usage: testFormAssociation("siteId", "formId")');
}
