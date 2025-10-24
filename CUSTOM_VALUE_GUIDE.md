# Custom Value System - Complete Guide

## Overview

The custom value system allows you to customize how checkbox field values appear in email notifications instead of showing the raw values ("on", "true", "checked").

## Two Types of Custom Values

### 1. **Global Custom Value** (`custom_value`)
- Single template applied to ALL checkbox fields
- Uses `{{field}}` placeholder for field name
- Example: `"I agree to the {{field}}"`
- Result for "Privacy Policy" checkbox: `"I agree to the Privacy Policy"`

### 2. **Per-Field Custom Values** (`field_custom_values`)
- Individual custom value for each checkbox field
- More specific and flexible
- Example:
  ```json
  {
    "Privacy Policy": "User has accepted the privacy policy",
    "Terms of Service": "User agreed to terms and conditions"
  }
  ```

## How It Works

### Priority System
When rendering checkbox values in emails, the system checks in this order:

1. **Per-field custom value** (if exists for that specific field)
2. **Global custom value** (if no per-field value exists)
3. **Raw value** ("on", "true", etc.) if neither exists

### Code Location
**File:** `nextjs-app/app/api/submissions/webhook/route.ts`

**Key Function:** `replaceTemplateVariables()` (line 270) and `generateEmailHTML()` (line 358)

```typescript
// Check for per-field custom value first
const fieldCustomValue = fieldCustomValues && fieldCustomValues[key];

if (fieldCustomValue) {
  // Use per-field custom value
  if (isCheckbox && isChecked) {
    displayValue = fieldCustomValue;
  }
} else if (customValue) {
  // Use global custom value
  if (isCheckbox && isChecked) {
    displayValue = customValue.replace(/\{\{field\}\}/g, key);
  }
} else if (isCheckbox && !isChecked) {
  displayValue = ''; // Don't show unchecked boxes
}
```

## Current Issue Diagnosis

Based on your log showing:
```
[Email] 📄 Form data for matching: {
  "Privacy Policy": "on",
  "Terms of Service": "on"
}
```

### Possible Issues:

1. **No Custom Values Configured**
   - Neither `custom_value` nor `field_custom_values` is set in Xano
   - Checkboxes will show as "on"

2. **Field Name Mismatch**
   - The field names in `field_custom_values` don't exactly match form data keys
   - Example: Form sends `"Privacy-Policy"` but config has `"Privacy Policy"`

3. **Custom Values Not Saved**
   - UI changes weren't saved to Xano `notification_setting` table
   - Check Xano database directly

## How to Fix

### Step 1: Check Current Settings

Run this in browser console or create a test file:

```javascript
// Check what's currently saved
fetch('http://localhost:1337/api/notifications?formId=YOUR_FORM_ID')
  .then(res => res.json())
  .then(data => {
    console.log('Custom Value:', data.custom_value);
    console.log('Field Custom Values:', data.field_custom_values);
  });
```

### Step 2: Set Per-Field Custom Values

**Via UI:**
1. Go to Notifications page for your form
2. Find the "Custom Values" section
3. For each checkbox field, click the settings icon
4. Enter custom text (e.g., "User agreed to privacy policy")
5. Click "Save Settings"

**Via API (Direct):**

```javascript
// Update notification settings with custom values
await xanoNotifications.update(notificationId, {
  field_custom_values: {
    "Privacy Policy": "User accepted the privacy policy",
    "Terms of Service": "User agreed to the terms of service"
  }
});
```

### Step 3: Test Form Submission

1. Submit your form with checkboxes checked
2. Check server logs for:
   ```
   [Email] ✅ Using per-field custom value "..." for checkbox field "Privacy Policy"
   ```
3. Check the received email for custom text

## Debugging Steps

### 1. Enable Detailed Logging

The webhook already has extensive logging. Check your server console for:

```
[Email] 🔍 Processing field "Privacy Policy" with per-field custom value
[Email] 🔍 isCheckbox: true, isChecked: true
[Email] ✅ Using per-field custom value "..." for checkbox field "Privacy Policy"
```

### 2. Check Xano Database

**Query:**
```sql
SELECT
  id,
  custom_value,
  field_custom_values
FROM notification_setting
WHERE form = YOUR_FORM_ID
```

**Expected Result:**
```json
{
  "custom_value": null,
  "field_custom_values": "{\"Privacy Policy\":\"User accepted...\",\"Terms of Service\":\"User agreed...\"}"
}
```

### 3. Verify Field Names Match

**Issue:** Form sends `"Privacy-Policy"` but config has `"Privacy Policy"`

**Solution:** The code already handles this with normalization:

```typescript
// File: webhook/route.ts, line 333-344
// Tries exact match, then with spaces→hyphens, then hyphens→spaces
const exactPattern = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi');
const dashedKey = key.replace(/\s+/g, '-');
const spacedKey = key.replace(/-/g, ' ');
```

But for `field_custom_values`, you need exact key matching.

### 4. Test with Debug Script

Create `test-custom-values.js`:

```javascript
const testData = {
  "Privacy Policy": "on",
  "Terms of Service": "on"
};

const fieldCustomValues = {
  "Privacy Policy": "User accepted the privacy policy",
  "Terms of Service": "User agreed to the terms of service"
};

Object.entries(testData).forEach(([key, value]) => {
  const isChecked = (value === 'on' || value === 'true');
  const customValue = fieldCustomValues[key];

  console.log(`Field: ${key}`);
  console.log(`  Raw value: ${value}`);
  console.log(`  Is checked: ${isChecked}`);
  console.log(`  Custom value: ${customValue}`);
  console.log(`  Display: ${isChecked && customValue ? customValue : value}`);
  console.log('');
});
```

## UI Locations

### Setting Per-Field Custom Values

**File:** `nextjs-app/app/notifications/page.tsx`

**Section:** Lines 1400-1450 - "Per-field Custom Values" tab

**How to Access:**
1. Navigate to `/notifications?siteId=YOUR_SITE_ID`
2. Click "Per-field Custom Values" tab
3. Set custom values for each checkbox field
4. Click "Save Settings"

### Checking if Values Are Saved

**File:** `nextjs-app/lib/xano.ts` - `xanoNotifications.getByFormId()`

```typescript
const settings = await xanoNotifications.getByFormId(formId);
console.log('Field Custom Values:', settings.field_custom_values);
```

## Common Mistakes

### ❌ Mistake 1: Not Parsing JSON from Xano
```typescript
// Wrong - using string as object
if (settings.field_custom_values['Privacy Policy']) { ... }
```

```typescript
// Correct - parse JSON string first
const parsed = typeof settings.field_custom_values === 'string'
  ? JSON.parse(settings.field_custom_values)
  : settings.field_custom_values;
if (parsed['Privacy Policy']) { ... }
```

### ❌ Mistake 2: Field Name Mismatch
```typescript
// Form sends: "Privacy-Policy"
// Config has: "Privacy Policy"
// Won't match!
```

**Solution:** Use exact field names from form data, or implement fuzzy matching.

### ❌ Mistake 3: Forgetting to Save
After changing values in UI, you MUST click "Save Settings" button.

## Expected Behavior

### Before Custom Values:
**Email shows:**
```
Privacy Policy: on
Terms of Service: on
```

### After Setting Per-Field Custom Values:
**Email shows:**
```
Privacy Policy: User has accepted the privacy policy
Terms of Service: User agreed to the terms of service
```

### With Global Custom Value (`"I agree to {{field}}"`):
**Email shows:**
```
Privacy Policy: I agree to Privacy Policy
Terms of Service: I agree to Terms of Service
```

## Next Steps to Debug Your Issue

1. **Check if custom values are saved:**
   ```bash
   node debug-per-field-values.js
   ```

2. **Check server logs during submission:**
   Look for lines starting with `[Email] 🔍 Processing field`

3. **Verify field names match:**
   Compare form data keys with `field_custom_values` keys

4. **Test with a simple global custom value first:**
   Set `custom_value` to `"Agreed to {{field}}"` and test

5. **If still not working, share:**
   - Server logs from submission
   - Output from `debug-per-field-values.js`
   - Screenshot of UI showing custom values entered

## Database Schema Reference

**Table:** `notification_setting`

```sql
field_custom_values TEXT  -- JSON string, e.g. '{"Field Name":"Custom Value"}'
custom_value TEXT          -- Template string, e.g. 'I agree to {{field}}'
```

**Important:** Xano stores JSON as TEXT, so it must be parsed with `JSON.parse()` when reading.
