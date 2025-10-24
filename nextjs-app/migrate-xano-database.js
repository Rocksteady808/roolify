#!/usr/bin/env node

/**
 * Xano Database Migration Script
 * 
 * This script helps you add the required columns to your Xano database.
 * 
 * IMPORTANT: You need to manually add these columns in your Xano admin panel:
 * 
 * 1. Go to your Xano workspace
 * 2. Navigate to the notification_setting table
 * 3. Add these columns:
 *    - site_id (Text, Required)
 *    - html_form_id (Text, Required)
 * 
 * 4. After adding the columns, run this script to migrate existing data:
 *    node migrate-xano-database.js
 */

const { xanoNotifications, xanoForms } = require('./lib/xano');

async function migrateDatabase() {
  console.log('🚀 Starting Xano database migration...');
  
  try {
    // Step 1: Get all existing notification settings
    console.log('📋 Fetching existing notification settings...');
    const allSettings = await xanoNotifications.getAll();
    console.log(`Found ${allSettings.length} notification settings`);
    
    // Step 2: Get all forms to map the data
    console.log('📋 Fetching all forms for data mapping...');
    const allForms = await xanoForms.getAll();
    console.log(`Found ${allForms.length} forms`);
    
    // Step 3: Migrate each notification setting
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const setting of allSettings) {
      console.log(`\n🔍 Processing notification setting ID ${setting.id}...`);
      
      // Find the linked form
      const linkedForm = allForms.find(f => f.id === setting.form);
      
      if (linkedForm) {
        console.log(`  📝 Found linked form: ${linkedForm.name} (site: ${linkedForm.site_id}, html_form_id: ${linkedForm.html_form_id})`);
        
        // Update the notification setting with the new fields
        try {
          await xanoNotifications.update(setting.id, {
            site_id: linkedForm.site_id,
            html_form_id: linkedForm.html_form_id
          });
          
          console.log(`  ✅ Updated notification setting ${setting.id}`);
          migratedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to update notification setting ${setting.id}:`, error.message);
        }
      } else {
        console.log(`  ⚠️ No linked form found for notification setting ${setting.id} (form ID: ${setting.form})`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Migrated: ${migratedCount} notification settings`);
    console.log(`⚠️ Skipped: ${skippedCount} notification settings (no linked form found)`);
    
    if (skippedCount > 0) {
      console.log(`\n💡 Note: Some notification settings couldn't be migrated because their linked forms were not found.`);
      console.log(`   This might happen if forms were deleted or if there are data inconsistencies.`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };

