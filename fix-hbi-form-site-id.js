/**
 * Quick Fix Script: Update HBI Form's site_id in Xano
 * 
 * Problem: Form 105 (HBI International Inquiry Form) has wrong site_id
 * Current: 68eb5d6db0e34d2e3ed12c0a
 * Should be: 652b10ed79cbf4ed07a349ed
 * 
 * This script updates the form record via Xano API
 */

const XANO_BASE_URL = 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

async function fixHBIFormSiteId() {
  console.log('🔧 Starting HBI Form site_id fix...\n');

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
    // Step 1: Get all forms to find the HBI form
    console.log('📋 Fetching all forms from Xano...');
    const formsResponse = await fetch(`${XANO_BASE_URL}/form`, { headers });
    
    if (!formsResponse.ok) {
      throw new Error(`Failed to fetch forms: ${formsResponse.status} ${formsResponse.statusText}`);
    }

    const allForms = await formsResponse.json();
    console.log(`✅ Found ${allForms.length} forms in database\n`);

    // Step 2: Find the HBI form
    const hbiForm = allForms.find(f => 
      f.name && f.name.includes('HBI International Inquiry')
    );

    if (!hbiForm) {
      console.error('❌ ERROR: HBI form not found in database');
      console.log('\nAvailable forms:');
      allForms.forEach(f => console.log(`  - ${f.id}: ${f.name} (site: ${f.site_id})`));
      process.exit(1);
    }

    console.log('🔍 Found HBI form:');
    console.log(`   ID: ${hbiForm.id}`);
    console.log(`   Name: ${hbiForm.name}`);
    console.log(`   Current site_id: ${hbiForm.site_id}`);
    console.log(`   html_form_id: ${hbiForm.html_form_id}\n`);

    // Step 3: Check if it needs updating
    const CORRECT_SITE_ID = '652b10ed79cbf4ed07a349ed';

    if (hbiForm.site_id === CORRECT_SITE_ID) {
      console.log('✅ Form already has correct site_id - no update needed!');
      process.exit(0);
    }

    // Step 4: Update the form (only site_id, html_form_id is already correct)
    console.log('🔄 Updating form to correct site_id...');
    const updateResponse = await fetch(`${XANO_BASE_URL}/form/${hbiForm.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        site_id: CORRECT_SITE_ID
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update form: ${updateResponse.status} ${errorText}`);
    }

    const updatedForm = await updateResponse.json();
    console.log('✅ Successfully updated form!');
    console.log(`   New site_id: ${updatedForm.site_id}`);
    console.log(`   html_form_id: ${updatedForm.html_form_id} (unchanged)\n`);

    console.log('🎉 Done! The HBI form should now appear in rule builder and notifications.');
    console.log('   Refresh those pages to see the changes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixHBIFormSiteId();

