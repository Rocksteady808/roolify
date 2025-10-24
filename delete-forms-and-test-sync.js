/**
 * Delete Forms and Test Sync Script
 * 
 * This script will:
 * 1. Delete ALL forms for the site from Xano
 * 2. Let you test the dashboard sync to see if it correctly adds them back
 */

const XANO_BASE_URL = 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';
const TARGET_SITE_ID = '652b10ed79cbf4ed07a349ed';

async function deleteFormsAndTestSync() {
  console.log('🗑️  Deleting all forms for site and testing sync...\n');

  // Get auth token from user
  const authToken = process.env.XANO_AUTH_TOKEN;
  if (!authToken) {
    console.error('❌ ERROR: XANO_AUTH_TOKEN environment variable not set');
    console.log('\nPlease run:');
    console.log('export XANO_AUTH_TOKEN="your-auth-token-here"');
    console.log('\nTo get your auth token, check localStorage.getItem("xano_auth_token") in browser console');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Step 1: Get all forms for the target site
    console.log(`📋 Fetching all forms for site ${TARGET_SITE_ID}...`);
    const formsResponse = await fetch(`${XANO_BASE_URL}/form`, { headers });
    
    if (!formsResponse.ok) {
      throw new Error(`Failed to fetch forms: ${formsResponse.status} ${formsResponse.statusText}`);
    }

    const allForms = await formsResponse.json();
    const siteForms = allForms.filter(f => f.site_id === TARGET_SITE_ID);
    
    console.log(`✅ Found ${siteForms.length} forms for site ${TARGET_SITE_ID}:`);
    siteForms.forEach(f => {
      console.log(`   - Form ${f.id}: ${f.name} (html_form_id: ${f.html_form_id})`);
    });
    console.log('');

    if (siteForms.length === 0) {
      console.log('✅ No forms found for this site - nothing to delete!');
      console.log('🎉 You can now test the dashboard sync.');
      return;
    }

    // Step 2: Delete each form
    console.log('🗑️  Deleting all forms...');
    for (const form of siteForms) {
      console.log(`   Deleting Form ${form.id}: ${form.name}...`);
      
      const deleteResponse = await fetch(`${XANO_BASE_URL}/form/${form.id}`, {
        method: 'DELETE',
        headers
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error(`   ❌ Failed to delete Form ${form.id}: ${deleteResponse.status} ${errorText}`);
      } else {
        console.log(`   ✅ Deleted Form ${form.id}`);
      }
    }

    console.log('\n🎉 All forms deleted!');
    console.log('\n📋 Now test the dashboard sync:');
    console.log('1. Go to your dashboard');
    console.log('2. Make sure you\'re on the correct site');
    console.log('3. Click the "Refresh" button');
    console.log('4. Watch the console logs - should see forms being synced');
    console.log('5. Check rule builder and notifications - forms should appear');
    console.log('\n🔍 Expected console logs:');
    console.log('[Dashboard] 🔄 Syncing forms to Xano database...');
    console.log('[Dashboard] Found 0 existing forms in Xano');
    console.log('[Dashboard] Syncing form: HBI International Inquiry Form (68f648d669c38f6206830743)');
    console.log('[Dashboard] ✅ Synced form "HBI International Inquiry Form" to Xano with ID: 123');
    console.log('[Dashboard] ✅ All forms synced to Xano database');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the deletion and test
deleteFormsAndTestSync();
