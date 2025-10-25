# Conditional Logic Debug Guide

## Issue Summary

Your conditional logic rules are not working on the site. This guide will help you identify and fix the issue.

## Root Cause Analysis

Based on the diagnostic tests, the conditional logic system is working correctly:

✅ **Rules are being loaded** - 2 active rules found  
✅ **Script is being generated** - Universal script created successfully  
✅ **Field matching logic is present** - Comprehensive field finder implemented  
✅ **Event listeners are set up** - Form interactions are being monitored  
✅ **Show/hide functions are working** - Element manipulation is functional  

## Most Likely Issues

### 1. Field ID Mismatch (Most Common)
The field IDs in your rules don't match the actual field IDs on the form.

**Your Rules Use:**
- `"Has Account"` 
- `"HBI Account Rep"`
- `"EIN Number"`
- `"Contact First Name"`
- `"Contact Last Name"`

**Actual Form Fields Might Have:**
- `"has-account"` (with hyphens)
- `"hbi_account_rep"` (with underscores)
- `"ein-number"` (with hyphens)
- `"contact-first-name"` (with hyphens)
- `"contact-last-name"` (with hyphens)

### 2. Script Not Loading
The Roolify script is not being loaded on the target page.

### 3. Timing Issues
The script is loading before the form elements are rendered.

## Debugging Steps

### Step 1: Check Browser Console
1. Open the target page in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Look for these messages:

**✅ Good Signs:**
```
[Roolify Universal Script] Loading for site 652b10ed79cbf4ed07a349ed...
[Roolify] Found 2 forms on this page
[Roolify] Rules loaded: 2
[Roolify] Conditional logic initialized
```

**❌ Problem Signs:**
```
[Roolify] Field not found: "Has Account"
[Roolify] Target element not found: "HBI Account Rep"
```

### Step 2: Check Field IDs
1. In the browser console, run this command:
```javascript
// List all form fields on the page
Array.from(document.querySelectorAll('input, select, textarea')).forEach((el, i) => {
  console.log(`${i + 1}. ID: "${el.id}", Name: "${el.name}", Type: "${el.type || el.tagName.toLowerCase()}"`);
});
```

2. Compare the actual field IDs with your rule field IDs

### Step 3: Test Field Matching
1. In the browser console, run this command:
```javascript
// Test if the script can find your fields
function testField(fieldId) {
  const field = document.getElementById(fieldId) || 
                document.querySelector(`[name="${fieldId}"]`) ||
                document.querySelector(`[data-name="${fieldId}"]`);
  console.log(`Field "${fieldId}": ${field ? 'FOUND' : 'NOT FOUND'}`);
  return field;
}

// Test your rule fields
testField('Has Account');
testField('HBI Account Rep');
testField('EIN Number');
testField('Contact First Name');
testField('Contact Last Name');
```

### Step 4: Use Enhanced Debug Script
1. Copy the contents of `enhanced-debug-script.js`
2. Paste it into the browser console
3. This will provide detailed debugging information

## Solutions

### Solution 1: Update Field IDs in Rules
If the field IDs don't match, update your rules with the correct field IDs:

1. Go to your rule builder
2. Update the field IDs to match the actual form fields
3. Save the rules
4. Test again

### Solution 2: Add Script to Your Page
Make sure the Roolify script is loaded on your page:

```html
<script src="http://localhost:3000/api/script/serve/652b10ed79cbf4ed07a349ed"></script>
```

### Solution 3: Fix Timing Issues
If the script loads before the form, add a delay:

```html
<script>
setTimeout(function() {
  const script = document.createElement('script');
  script.src = 'http://localhost:3000/api/script/serve/652b10ed79cbf4ed07a349ed';
  document.head.appendChild(script);
}, 1000);
</script>
```

## Testing Your Fix

### Test 1: Basic Functionality
1. Open the page with the form
2. Check browser console for Roolify messages
3. Try interacting with the form fields
4. Check if conditional logic works

### Test 2: Field Matching
1. Use the enhanced debug script
2. Check if all fields are found
3. Verify rules are executing
4. Check if actions are being applied

### Test 3: Rule Execution
1. Fill out the form fields
2. Check console for rule execution logs
3. Verify conditions are being evaluated
4. Check if actions are being applied

## Common Field ID Patterns

Here are common field ID patterns you might encounter:

| Rule Field ID | Possible Actual IDs |
|---------------|-------------------|
| `"Has Account"` | `"has-account"`, `"has_account"`, `"HasAccount"` |
| `"HBI Account Rep"` | `"hbi-account-rep"`, `"hbi_account_rep"`, `"HBIAccountRep"` |
| `"EIN Number"` | `"ein-number"`, `"ein_number"`, `"EINNumber"` |
| `"Contact First Name"` | `"contact-first-name"`, `"contact_first_name"`, `"ContactFirstName"` |
| `"Contact Last Name"` | `"contact-last-name"`, `"contact_last_name"`, `"ContactLastName"` |

## Advanced Debugging

### Enable Verbose Logging
Add this to your page to get more detailed logs:

```html
<script>
window.ROOLIFY_DEBUG = true;
</script>
<script src="http://localhost:3000/api/script/serve/652b10ed79cbf4ed07a349ed"></script>
```

### Check Network Requests
1. Open Developer Tools
2. Go to Network tab
3. Reload the page
4. Look for requests to `/api/script/serve/652b10ed79cbf4ed07a349ed`
5. Check if the request is successful (200 status)

### Verify Script Content
1. In the browser console, run:
```javascript
// Check if the script is loaded
console.log('Script loaded:', typeof window.ROOLIFY_CONFIG !== 'undefined');
```

## Still Having Issues?

If the conditional logic still isn't working after following these steps:

1. **Check the actual form HTML** - Look at the source code to see the exact field IDs
2. **Test with a simple rule** - Create a basic show/hide rule to isolate the issue
3. **Use the enhanced debug script** - This will show exactly what's happening
4. **Check for JavaScript errors** - Look for any errors in the console that might be breaking the script

## Quick Fix Commands

### Test All Fields
```javascript
// Test all form fields
document.querySelectorAll('input, select, textarea').forEach(el => {
  console.log(`ID: "${el.id}", Name: "${el.name}", Type: "${el.type || el.tagName}"`);
});
```

### Test Field Matching
```javascript
// Test field matching for your specific fields
['Has Account', 'HBI Account Rep', 'EIN Number', 'Contact First Name', 'Contact Last Name'].forEach(fieldId => {
  const field = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
  console.log(`${fieldId}: ${field ? 'FOUND' : 'NOT FOUND'}`);
});
```

### Force Rule Execution
```javascript
// Force execute all rules (if script is loaded)
if (typeof window.executeAllRules === 'function') {
  window.executeAllRules();
}
```

Remember: The most common issue is field ID mismatch. Check the actual field IDs on your form and update your rules accordingly.
