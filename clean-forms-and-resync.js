/**
 * Clean Forms and Re-sync Script
 * 
 * This script will:
 * 1. Delete all forms for the site from Xano form table
 * 2. Let the dashboard re-sync them with correct site_id and html_form_id
 */

const XANO_BASE_URL = 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';
const TARGET_SITE_ID = '652b10ed79cbf4ed07a349ed';

async function cleanAndResync() {
  console.log('🧹 Starting clean forms and re-sync process...\n');

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
      console.log('✅ No forms found for this site - nothing to clean!');
      console.log('🎉 You can now refresh the dashboard to sync forms from Webflow.');
      return;
    }

    // Step 2: Delete each form
    console.log('🗑️  Deleting forms...');
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

    console.log('\n🎉 Clean-up complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your dashboard');
    console.log('2. Make sure you\'re on the correct site');
    console.log('3. Click "Refresh" to re-sync forms from Webflow');
    console.log('4. The forms will be created with correct site_id and html_form_id');
    console.log('5. Check rule builder and notifications - forms should now appear!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the clean-up
cleanAndResync();
