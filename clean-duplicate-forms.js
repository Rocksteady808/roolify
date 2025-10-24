/**
 * Clean Duplicate Forms Script
 * 
 * This script will:
 * 1. Find duplicate forms in Xano (same html_form_id + site_id)
 * 2. Keep the newest one and delete the older duplicates
 */

const XANO_BASE_URL = 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

async function cleanDuplicateForms() {
  console.log('🧹 Starting duplicate forms cleanup...\n');

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
    // Step 1: Get all forms
    console.log('📋 Fetching all forms from Xano...');
    const formsResponse = await fetch(`${XANO_BASE_URL}/form`, { headers });
    
    if (!formsResponse.ok) {
      throw new Error(`Failed to fetch forms: ${formsResponse.status} ${formsResponse.statusText}`);
    }

    const allForms = await formsResponse.json();
    console.log(`✅ Found ${allForms.length} total forms\n`);

    // Step 2: Find duplicates by html_form_id + site_id
    const duplicates = new Map();
    
    allForms.forEach(form => {
      const key = `${form.html_form_id}-${form.site_id}`;
      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }
      duplicates.get(key).push(form);
    });

    // Step 3: Process duplicates
    let totalDeleted = 0;
    
    for (const [key, forms] of duplicates) {
      if (forms.length > 1) {
        console.log(`🔍 Found ${forms.length} duplicates for key: ${key}`);
        console.log(`   Forms: ${forms.map(f => `${f.id} (${f.name})`).join(', ')}`);
        
        // Sort by created_at (newest first)
        forms.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        
        // Keep the newest (first in sorted array), delete the rest
        const keepForm = forms[0];
        const deleteForms = forms.slice(1);
        
        console.log(`   ✅ Keeping: Form ${keepForm.id} (${keepForm.name}) - newest`);
        
        for (const formToDelete of deleteForms) {
          console.log(`   🗑️  Deleting: Form ${formToDelete.id} (${formToDelete.name}) - duplicate`);
          
          const deleteResponse = await fetch(`${XANO_BASE_URL}/form/${formToDelete.id}`, {
            method: 'DELETE',
            headers
          });

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.error(`   ❌ Failed to delete Form ${formToDelete.id}: ${deleteResponse.status} ${errorText}`);
          } else {
            console.log(`   ✅ Deleted Form ${formToDelete.id}`);
            totalDeleted++;
          }
        }
        console.log('');
      }
    }

    if (totalDeleted === 0) {
      console.log('✅ No duplicates found - all forms are unique!');
    } else {
      console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} duplicate forms.`);
    }

    console.log('\n📋 Next steps:');
    console.log('1. Check your Xano database - duplicates should be gone');
    console.log('2. Test rule builder and notifications - forms should appear');
    console.log('3. The dashboard sync logic has been improved to prevent future duplicates');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanDuplicateForms();
