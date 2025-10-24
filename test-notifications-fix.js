#!/usr/bin/env node

/**
 * Test script to verify that the notifications API doesn't create duplicate forms
 * This script tests the new architecture that uses site_id + html_form_id directly
 */

const testNotificationsAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  const siteId = '652b10ed79cbf4ed07a349ed';
  const formId = '68f648d669c38f6206830743';
  
  console.log('🧪 Testing Notifications API Fix');
  console.log('=====================================');
  
  try {
    // Test 1: Check if notifications API is working
    console.log('\n1. Testing GET notifications API...');
    const getResponse = await fetch(`${baseUrl}/api/notifications?formId=${formId}&siteId=${siteId}`);
    const getData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET notifications API working');
      console.log('Response:', JSON.stringify(getData, null, 2));
    } else {
      console.log('❌ GET notifications API failed');
      console.log('Error:', getData);
    }
    
    // Test 2: Test saving notification settings
    console.log('\n2. Testing POST notifications API...');
    const postData = {
      formId: formId,
      siteId: siteId,
      formName: 'Test Form',
      adminRecipients: 'test@example.com',
      adminRoutes: [],
      userRoutes: [],
      emailTemplate: '<p>Test template</p>',
      customValue: 'I have read and agree to the {{field}}',
      fieldCustomValues: {
        'Privacy Policy': 'I have read and agree to the Privacy Policy',
        'Terms of Service': 'I accept the Terms of Service'
      }
    };
    
    const postResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const postResult = await postResponse.json();
    
    if (postResponse.ok) {
      console.log('✅ POST notifications API working');
      console.log('Response:', JSON.stringify(postResult, null, 2));
    } else {
      console.log('❌ POST notifications API failed');
      console.log('Error:', postResult);
    }
    
    // Test 3: Verify no duplicate forms were created
    console.log('\n3. Checking for duplicate forms...');
    const formsResponse = await fetch(`${baseUrl}/api/forms/dynamic-options?siteId=${siteId}`);
    const formsData = await formsResponse.json();
    
    if (formsResponse.ok) {
      console.log('✅ Forms API working');
      console.log('Forms found:', formsData.forms?.length || 0);
      
      // Check for duplicate forms
      const formNames = formsData.forms?.map(f => f.name) || [];
      const uniqueNames = [...new Set(formNames)];
      
      if (formNames.length === uniqueNames.length) {
        console.log('✅ No duplicate forms detected');
      } else {
        console.log('❌ Duplicate forms detected!');
        console.log('All form names:', formNames);
        console.log('Unique form names:', uniqueNames);
      }
    } else {
      console.log('❌ Forms API failed');
      console.log('Error:', formsData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test
testNotificationsAPI();


