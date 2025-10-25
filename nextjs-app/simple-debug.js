#!/usr/bin/env node

const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          console.log(`🔄 Redirecting to: ${redirectUrl}`);
          const fullUrl = redirectUrl.startsWith('http') ? redirectUrl : `http://localhost:3000${redirectUrl}`;
          return makeRequest(fullUrl).then(resolve).catch(reject);
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

async function testRules() {
  console.log('🔍 Testing Rules API...\n');
  
  try {
    const response = await makeRequest('http://localhost:3000/api/form-rules?siteId=652b10ed79cbf4ed07a349ed');
    const data = JSON.parse(response);
    
    console.log(`📋 Found ${data.rules.length} rules\n`);
    
    for (const rule of data.rules) {
      if (rule.conditions.length === 0) continue;
      
      console.log(`🔧 Rule: "${rule.name}"`);
      console.log(`   Form ID: ${rule.formId}`);
      console.log(`   Site ID: ${rule.siteId}`);
      console.log(`   Active: ${rule.isActive}`);
      
      console.log(`   📝 Conditions:`);
      for (const condition of rule.conditions) {
        console.log(`      - Field: "${condition.fieldId}"`);
        console.log(`        Operator: "${condition.operator}"`);
        console.log(`        Value: "${condition.value}"`);
      }
      
      console.log(`   🎯 Actions:`);
      for (const action of rule.actions) {
        console.log(`      - Type: "${action.type}"`);
        console.log(`        Target: "${action.targetFieldId}"`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRules();
