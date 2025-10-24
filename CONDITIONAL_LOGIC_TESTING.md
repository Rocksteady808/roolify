# Universal Conditional Logic - Testing Guide

## Overview
This document tests that the Roolify conditional logic system works universally for ANY form element, ANY field type, and ANY rule configuration.

## Supported Field Types

The script MUST work with all HTML5 input types:

### Text-Based Inputs
- ✅ `<input type="text">`
- ✅ `<input type="email">`
- ✅ `<input type="tel">`  
- ✅ `<input type="number">`
- ✅ `<input type="url">`
- ✅ `<input type="password">`
- ✅ `<textarea>`

### Selection Inputs
- ✅ `<select>` (dropdown)
- ✅ `<input type="radio">` (radio buttons)
- ✅ `<input type="checkbox">` (checkboxes)

### Other Input Types
- ✅ `<input type="date">`
- ✅ `<input type="time">`
- ✅ `<input type="datetime-local">`
- ✅ `<input type="range">`
- ✅ `<input type="file">`

## Supported Operators

### Comparison Operators
| Operator | Aliases | Example |
|----------|---------|---------|
| `equals` | `is`, `is_equal_to`, `==`, `===` | Field value exactly matches |
| `not_equals` | `is_not`, `is_not_equal_to`, `!=`, `!==` | Field value doesn't match |
| `contains` | - | Field value includes substring |
| `not_contains` | - | Field value doesn't include substring |
| `starts_with` | - | Field value begins with string |
| `ends_with` | - | Field value ends with string |
| `is_empty` | - | Field is blank/empty |
| `is_not_empty` | - | Field has any value |

## Supported Actions

| Action | Behavior |
|--------|----------|
| `show` | Makes element visible (including its label) |
| `hide` | Makes element invisible (including its label) |
| `toggle` | Switches between show/hide |
| `enable` | Removes disabled attribute |
| `disable` | Adds disabled attribute |

## Rule Types

### 1. Simple Show/Hide Rule
**Use case:** Show element B when element A has a specific value

```javascript
{
  conditions: [
    { fieldId: "Select-a-State", operator: "equals", value: "CA" }
  ],
  actions: [
    { type: "show", targetFieldId: "California-Checkbox" }
  ]
}
```

**Expected behavior:**
- When user selects "CA", California checkbox appears
- When user selects anything else, California checkbox remains hidden (or is hidden if previously shown)

### 2. Multi-Option Index-Based Rule
**Use case:** Show different elements based on different select options

```javascript
{
  conditions: [
    { fieldId: "Select-a-State", operator: "equals", value: "CA" },
    { fieldId: "Select-a-State", operator: "equals", value: "NY" },
    { fieldId: "Select-a-State", operator: "equals", value: "TX" }
  ],
  actions: [
    { type: "show", targetFieldId: "California-Checkbox" },
    { type: "show", targetFieldId: "New-York-Checkbox" },
    { type: "show", targetFieldId: "Texas-Checkbox" }
  ]
}
```

**Expected behavior:**
- All conditions are on the SAME field (`Select-a-State`)
- Conditions equal actions (3 conditions, 3 actions)
- Script uses 1:1 index matching:
  - If "CA" selected → Show California, hide NY and TX
  - If "NY" selected → Show NY, hide CA and TX
  - If "TX" selected → Show TX, hide CA and NY
  - If "FL" selected (not in rule) → Hide all three

### 3. Multi-Field AND Rule
**Use case:** Show element only if MULTIPLE conditions are met

```javascript
{
  conditions: [
    { fieldId: "Country", operator: "equals", value: "USA" },
    { fieldId: "Age", operator: "not_equals", value: "" },
    { fieldId: "Agree-Terms", operator: "equals", value: "true" }
  ],
  actions: [
    { type: "show", targetFieldId: "Submit-Button" }
  ]
}
```

**Expected behavior:**
- ALL conditions must be true to execute actions
- If Country = USA AND Age is filled AND Terms are checked → Show Submit
- If ANY condition fails → Submit remains hidden

### 4. Multi-Condition OR Rule (Same Field)
**Use case:** Show element if field matches ANY of several values

```javascript
{
  conditions: [
    { fieldId: "Payment-Method", operator: "equals", value: "credit" },
    { fieldId: "Payment-Method", operator: "equals", value: "debit" }
  ],
  actions: [
    { type: "show", targetFieldId: "Card-Number" }
  ]
}
```

**Expected behavior:**
- Conditions on SAME field = OR logic
- If Payment = "credit" OR Payment = "debit" → Show Card Number
- Works ONLY if actions < conditions (not 1:1 matching)

## Field Value Extraction Logic

The script MUST correctly extract values from different field types:

### Text/Email/Tel/URL/Number/Password
```javascript
fieldValue = field.value || '';
```

### Textarea
```javascript
fieldValue = field.value || field.textContent || '';
```

### Select (Dropdown)
```javascript
fieldValue = field.value; // Selected option's value attribute
```

### Checkbox
```javascript
if (field.checked) {
  fieldValue = field.value; // Usually 'on' or custom value
  // OR
  fieldValue = 'true'; // Boolean representation
} else {
  fieldValue = ''; // or 'false'
}
```

### Radio Button
```javascript
if (field.name) {
  // Find checked radio in group
  const checkedRadio = document.querySelector(`input[name="${field.name}"]:checked`);
  fieldValue = checkedRadio ? checkedRadio.value : '';
} else {
  // Single radio (rare)
  fieldValue = field.checked ? field.value : '';
}
```

## Element Targeting

The script uses a 3-tier fallback system to find elements:

### 1. By ID (Primary)
```javascript
document.getElementById(fieldId)
```

### 2. By Name Attribute
```javascript
document.querySelector(`[name="${fieldId}"]`)
```

### 3. Case-Insensitive Search
```javascript
document.querySelectorAll('input, select, textarea')
// Check if el.id or el.name matches (case-insensitive)
```

### 4. Hyphen/Space Conversion
If `Field-Name` not found, try `Field Name` and vice versa.

## Label Auto-Pairing

The script automatically pairs labels with their inputs using `data-roolify` attribute:

```javascript
function autoPairElements() {
  // Find all inputs, selects, textareas
  const formElements = document.querySelectorAll('input, select, textarea');
  
  for (const element of formElements) {
    if (!element.id) continue;
    
    // Add data-roolify to the element itself
    element.setAttribute('data-roolify', element.id);
    
    // Find associated label
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      label.setAttribute('data-roolify', element.id);
    }
  }
}
```

**Result:** When hiding/showing an element, both the input AND its label are hidden/shown together.

## Show/Hide Implementation

### Show Element
```javascript
function showElement(element) {
  const elementId = element.id;
  const relatedElements = document.querySelectorAll(`[data-roolify="${elementId}"]`);
  
  relatedElements.forEach(el => {
    el.style.display = '';
    el.style.visibility = 'visible';
    el.style.opacity = '1';
    el.classList.remove('roolify-hidden');
    el.classList.add('roolify-visible');
  });
}
```

### Hide Element
```javascript
function hideElement(element) {
  const elementId = element.id;
  const relatedElements = document.querySelectorAll(`[data-roolify="${elementId}"]`);
  
  relatedElements.forEach(el => {
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
    el.classList.remove('roolify-visible');
    el.classList.add('roolify-hidden');
  });
}
```

## Test Scenarios

### Test 1: Text Input → Show/Hide
- Field A: Text input with ID `Full-Name`
- Field B: Email input with ID `Email`
- Rule: When `Full-Name` is not empty, show `Email`
- Operator: `is_not_empty`
- Expected: Email field appears as soon as user types anything in Full Name

### Test 2: Select → Multiple Show/Hide
- Field A: Select with ID `Select-a-Country`
- Fields B, C, D: Checkboxes for `USA`, `UK`, `Japan`
- Rule: Index-based (3 conditions, 3 actions)
- Expected: Only the checkbox for the selected country appears

### Test 3: Checkbox → Show/Hide
- Field A: Checkbox with ID `Agree-Terms`
- Field B: Submit button with ID `Submit`
- Rule: When `Agree-Terms` equals `true` (checked), show `Submit`
- Expected: Submit button appears only when checkbox is checked

### Test 4: Radio → Show/Hide
- Field A: Radio group with name `Has-Account` (values: `yes`, `no`)
- Field B: Text input with ID `Account-Number`
- Rule: When `Has-Account` equals `yes`, show `Account-Number`
- Expected: Account Number field appears only when "Yes" radio is selected

### Test 5: Multi-Field AND
- Field A: Select with ID `Country` (value: `USA`)
- Field B: Checkbox with ID `Over-18` (value: `true`)
- Field C: Text input with ID `Special-Offer-Code`
- Rule: When `Country` equals `USA` AND `Over-18` equals `true`, show `Special-Offer-Code`
- Expected: Special offer code appears ONLY if BOTH conditions are met

### Test 6: Dynamic Form Updates
- User selects "CA" → California checkbox appears
- User changes to "NY" → California disappears, NY appears
- User changes to "FL" (not in rule) → Both disappear
- User changes back to "CA" → California reappears

## Edge Cases

### 1. Element Not Found
- If target element doesn't exist, log warning and continue
- Don't break the script or other rules

### 2. Value Normalization
- Trim whitespace before comparing
- Handle empty strings vs null vs undefined
- Checkbox: checked = `'true'` or `field.value`, unchecked = `''` or `'false'`

### 3. Duplicate Field IDs
- If multiple elements have same ID (invalid HTML), script uses first match
- Log warning about duplicate IDs

### 4. Initially Hidden Elements
- Auto-pairing runs on page load BEFORE rules execute
- If element starts hidden (`display: none`), it still gets `data-roolify` attribute
- Rule can still find and show it later

### 5. Dynamically Added Elements
- Script runs on `DOMContentLoaded`
- For SPAs or dynamically added forms, would need manual `init()` call
- Current implementation is for static pages or Webflow sites

## Browser Compatibility

The script uses standard DOM APIs supported by all modern browsers:

- `querySelector` / `querySelectorAll` ✅
- `classList.add` / `classList.remove` ✅
- `setAttribute` ✅
- `addEventListener` ✅
- ES6 features (const, let, arrow functions, template literals) ✅

**Minimum browser versions:**
- Chrome 49+
- Firefox 45+
- Safari 10+
- Edge 14+

## Performance Considerations

### Optimization 1: Event Delegation
Currently, the script adds listeners to each field individually. For large forms, this could be optimized with event delegation on the form element.

### Optimization 2: Debouncing
Text input changes trigger rules on every keystroke. Consider debouncing for performance.

### Optimization 3: Rule Caching
Currently, rules are evaluated every time a field changes. Could cache results for fields that haven't changed.

## Security Considerations

### XSS Prevention
- Rules are generated server-side (trusted)
- Field values are NOT eval'd or inserted as innerHTML
- All DOM manipulation uses safe methods (setAttribute, style.display, etc.)

### CSP Compliance
- Script uses inline styles (blocked by strict CSP)
- Alternative: Use CSS classes only (`.roolify-hidden { display: none; }`)

## Summary: Is It Universal?

✅ **YES** - The current implementation is universal IF:
1. All form elements have unique IDs
2. Field IDs in rules match HTML element IDs
3. Operators are one of the supported types
4. Actions are `show`, `hide`, `toggle`, `enable`, or `disable`

❌ **LIMITATIONS:**
1. Doesn't handle complex operators like `greater_than`, `less_than`, `regex`
2. Doesn't support nested conditions with explicit AND/OR grouping
3. Doesn't handle date comparisons or numeric comparisons (all values treated as strings)
4. Doesn't support actions like `set_value`, `add_class`, `redirect`

## Recommendations for Production

### 1. Add Numeric Comparison Operators
```javascript
case 'greater_than':
  conditionMet = parseFloat(fieldValue) > parseFloat(condition.value);
  break;
case 'less_than':
  conditionMet = parseFloat(fieldValue) < parseFloat(condition.value);
  break;
```

### 2. Add Date Comparison Operators
```javascript
case 'after':
  conditionMet = new Date(fieldValue) > new Date(condition.value);
  break;
case 'before':
  conditionMet = new Date(fieldValue) < new Date(condition.value);
  break;
```

### 3. Add Regex Operator
```javascript
case 'matches':
  const regex = new RegExp(condition.value);
  conditionMet = regex.test(fieldValue);
  break;
```

### 4. Better Error Handling
```javascript
if (!targetElement) {
  console.error(`[Roolify] ERROR: Cannot find element "${action.targetFieldId}"`);
  console.error(`[Roolify] Available IDs:`, Array.from(document.querySelectorAll('[id]')).map(el => el.id));
  continue;
}
```

### 5. Add Validation
Before deploying rules, validate that:
- All referenced field IDs exist in the form
- All operators are supported
- All actions are valid types
- Conditions and actions are properly paired

## Current Status

✅ **READY FOR PRODUCTION** with the following supported scenarios:
- Text/select/checkbox/radio inputs
- Show/hide/toggle/enable/disable actions
- All comparison operators (equals, contains, etc.)
- Index-based matching for multi-option dropdowns
- Multi-field AND logic
- Same-field OR logic
- Label auto-pairing

⚠️ **CONSIDER ADDING** for advanced use cases:
- Numeric/date comparisons
- Regex matching
- Additional actions (set_value, redirect, etc.)
- Nested AND/OR logic
- Custom JavaScript actions











