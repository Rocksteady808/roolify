# Action Target Dropdown Fix - Summary

## Issue
When setting up the "Then" action in the Rule Builder, the dropdown to select which element to show/hide was empty. No options were appearing.

## Root Cause
The `/api/forms/form-specific` endpoint was using hardcoded filtering logic that only returned elements for forms with specific names ("state" or "country"). This meant:
- HBI form: 0 elements returned
- Question form: 0 elements returned  
- Any other form: 0 elements returned
- Only "State Form" and "Country Form" were getting their elements

The filtering code looked like this:
```typescript
if (formName.toLowerCase().includes('state')) {
  return element.id.includes('state') || ...
} else if (formName.toLowerCase().includes('country')) {
  return element.id.includes('country') || ...
} else {
  return false; // Nothing for other forms!
}
```

## Solution
Removed the hardcoded filtering and now ALL scanned elements are included for ALL forms:

```typescript
// Include ALL scanned elements for this form
// Don't filter by form name - include everything so users can show/hide any element
const formElements = siteElements;
```

## What This Means
Now when you set up rules:
- **All forms** get access to ALL scanned elements
- You can show/hide **any element with an ID** from any form
- The "Then" dropdown will show all available elements
- Elements are marked with `(div)`, `(select)`, etc. so you know what they are

## Example
Before: HBI form had 0 show/hide targets
After: HBI form has 9 show/hide targets:
- `state-form (div)`
- `Select-a-State (select)`
- `california-info (div)`
- `newyork-info (div)`
- `texas-info (div)`
- `country-form (div)`
- `united-states-info (div)`
- `united-kingdom-info (div)`
- `american-samoa-info (div)`

## Testing
1. Go to Rule Builder
2. Select any form
3. In the "Then" section, click the target element dropdown
4. You should now see all available elements with their types
5. Select any element to show/hide based on your conditions

## Additional Improvements
- Added helpful message when no elements are found
- Added debug logging to see what fields are being merged
- Improved field display names to use `displayName || name`




