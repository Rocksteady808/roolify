#!/usr/bin/env node

/**
 * Custom Value Diagnostic Tool
 *
 * This script helps diagnose issues with custom checkbox values
 * in email notifications.
 *
 * Usage:
 *   node diagnose-custom-values.js [formId]
 *
 * Example:
 *   node diagnose-custom-values.js 68eb5d8e93a70150aa597336
 */

const formId = process.argv[2];

if (!formId) {
  console.log('❌ Error: Please provide a form ID');
  console.log('Usage: node diagnose-custom-values.js [formId]');
  console.log('Example: node diagnose-custom-values.js 68eb5d8e93a70150aa597336');
  process.exit(1);
}

const baseUrl = 'http://localhost:1337';

console.log('');
console.log('🔍 Custom Value Diagnostic Tool');
console.log('================================');
console.log('');
console.log('Form ID:', formId);
console.log('');

async function diagnose() {
  try {
    // Step 1: Get notification settings
    console.log('📋 Step 1: Fetching notification settings...');
    const response = await fetch(`${baseUrl}/api/notifications?formId=${formId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const settings = await response.json();

    console.log('✅ Settings loaded successfully');
    console.log('');

    // Step 2: Check custom value configuration
    console.log('📧 Step 2: Custom Value Configuration');
    console.log('-------------------------------------');

    const hasGlobalCustomValue = !!settings.custom_value;
    const hasFieldCustomValues = !!settings.field_custom_values;

    if (!hasGlobalCustomValue && !hasFieldCustomValues) {
      console.log('❌ NO CUSTOM VALUES CONFIGURED');
      console.log('');
      console.log('This means checkbox values will show as "on", "true", or "checked"');
      console.log('');
      console.log('To fix this:');
      console.log('1. Go to the Notifications page for this form');
      console.log('2. Click "Per-field Custom Values" tab');
      console.log('3. Set custom values for each checkbox field');
      console.log('4. Click "Save Settings"');
      console.log('');
      return;
    }

    if (hasGlobalCustomValue) {
      console.log('✅ Global custom value configured:');
      console.log(`   "${settings.custom_value}"`);
      console.log('');
      console.log('   This will apply to ALL checkbox fields');
      console.log('   Example: "Privacy Policy" → ' + settings.custom_value.replace(/\{\{field\}\}/g, 'Privacy Policy'));
      console.log('');
    } else {
      console.log('ℹ️  No global custom value configured');
      console.log('');
    }

    if (hasFieldCustomValues) {
      console.log('✅ Per-field custom values configured:');
      console.log('');

      // Parse field_custom_values (might be JSON string from Xano)
      let fieldValues;
      try {
        fieldValues = typeof settings.field_custom_values === 'string'
          ? JSON.parse(settings.field_custom_values)
          : settings.field_custom_values;
      } catch (e) {
        console.log('❌ Error parsing field_custom_values:', e.message);
        console.log('Raw value:', settings.field_custom_values);
        return;
      }

      if (Object.keys(fieldValues).length === 0) {
        console.log('⚠️  field_custom_values exists but is empty');
        console.log('   No per-field custom values configured');
        console.log('');
      } else {
        Object.entries(fieldValues).forEach(([field, value]) => {
          console.log(`   "${field}" → "${value}"`);
        });
        console.log('');
        console.log(`Total: ${Object.keys(fieldValues).length} field(s) configured`);
        console.log('');
      }

      // Step 3: Test with example data
      console.log('🧪 Step 3: Testing with Example Form Data');
      console.log('-----------------------------------------');

      const exampleFormData = {
        "Privacy Policy": "on",
        "Terms of Service": "on",
        "Marketing Emails": "off"
      };

      console.log('Example submission:');
      console.log(JSON.stringify(exampleFormData, null, 2));
      console.log('');

      console.log('Expected email output:');
      console.log('');

      Object.entries(exampleFormData).forEach(([field, value]) => {
        const isChecked = (value === 'on' || value === 'true' || value === true);

        let displayValue = value;

        // Check for per-field custom value
        if (fieldValues[field]) {
          if (isChecked) {
            displayValue = fieldValues[field];
            console.log(`✅ ${field}: "${displayValue}" (from per-field custom value)`);
          } else {
            displayValue = '';
            console.log(`⚪ ${field}: [hidden] (unchecked, not shown in email)`);
          }
        } else if (hasGlobalCustomValue && isChecked) {
          displayValue = settings.custom_value.replace(/\{\{field\}\}/g, field);
          console.log(`✅ ${field}: "${displayValue}" (from global custom value)`);
        } else if (isChecked) {
          console.log(`⚠️  ${field}: "${value}" (NO custom value configured - will show raw value)`);
        } else {
          console.log(`⚪ ${field}: [hidden] (unchecked, not shown in email)`);
        }
      });
      console.log('');

      // Step 4: Check for potential issues
      console.log('🔎 Step 4: Potential Issues Check');
      console.log('---------------------------------');

      const issues = [];

      // Check for field name mismatches
      const configuredFields = Object.keys(fieldValues);
      const exampleFields = Object.keys(exampleFormData);

      const unmatchedConfigFields = configuredFields.filter(f => !exampleFields.includes(f));
      const unmatchedExampleFields = exampleFields.filter(f => !configuredFields.includes(f) && f !== 'Marketing Emails');

      if (unmatchedConfigFields.length > 0) {
        issues.push({
          level: 'warning',
          message: `Configured custom values for fields not in example: ${unmatchedConfigFields.join(', ')}`,
          fix: 'Make sure field names in config match EXACTLY with form field names'
        });
      }

      if (unmatchedExampleFields.length > 0) {
        issues.push({
          level: 'warning',
          message: `Example fields without custom values: ${unmatchedExampleFields.join(', ')}`,
          fix: 'Add custom values for these fields in the UI'
        });
      }

      if (issues.length === 0) {
        console.log('✅ No issues detected!');
        console.log('');
        console.log('Configuration looks good. Custom values should work correctly.');
        console.log('');
      } else {
        issues.forEach((issue, i) => {
          const icon = issue.level === 'error' ? '❌' : '⚠️';
          console.log(`${icon} Issue ${i + 1}:`, issue.message);
          console.log(`   Fix: ${issue.fix}`);
          console.log('');
        });
      }

    } else {
      console.log('ℹ️  No per-field custom values configured');
      console.log('');
    }

    // Step 5: Test a real submission
    console.log('📬 Step 5: Test with Real Form Submission');
    console.log('-----------------------------------------');
    console.log('');
    console.log('To test with a real submission:');
    console.log('');
    console.log('1. Submit your form with checkboxes checked');
    console.log('2. Watch server logs for lines like:');
    console.log('   [Email] ✅ Using per-field custom value "..." for checkbox field "..."');
    console.log('3. Check the received email');
    console.log('');
    console.log('If custom values still don\'t appear:');
    console.log('- Verify field names match EXACTLY (case-sensitive)');
    console.log('- Check that you clicked "Save Settings" after configuring');
    console.log('- Try refreshing the page and checking settings again');
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('- Server is running on http://localhost:1337');
    console.log('- Form ID is correct');
    console.log('- Form has notification settings configured');
    console.log('');
  }
}

// Run the diagnostic
diagnose();
