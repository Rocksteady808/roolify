# Debug: Draft Form Still Showing

## Issue
Form on "[Draft] Style Guide" page is still showing up in the dashboard despite being on a draft page.

## Debug Logging Added

I've added extensive console logging to help identify why this form isn't being filtered:

### Page-Level Logs
```javascript
[Dashboard] 📄 Page: "Style Guide" (id: xxx) - archived: false, isDraft: true
[Dashboard] ❌ Excluding DRAFT page "Style Guide"
```

### Form-Level Logs
```javascript
[Dashboard] 🔍 Checking form: "Email Form" on "Style Guide" (pageId: xxx)
[Dashboard] 🔍 Form full data: { ... complete form object ... }
[Dashboard] ❌ FILTERED: Unpublished/archived page - "Email Form" (pageId: xxx)
```

## What to Check

### 1. Refresh Dashboard
Refresh the dashboard at http://localhost:3000/dashboard and open the browser console (F12).

### 2. Look for These Logs

**Expected Behavior:**
```
[Dashboard] 📄 Page: "Style Guide" (id: xxx) - archived: false, isDraft: true
[Dashboard] ❌ Excluding DRAFT page "Style Guide"
[Dashboard] 📄 Published page IDs: [ids WITHOUT the Style Guide page]
[Dashboard] 🔍 Checking form: "Email Form" on "Style Guide" (pageId: xxx)
[Dashboard] ❌ FILTERED: Unpublished/archived page - "Email Form"
```

**If Bug Still Exists, Look For:**
- Is `isDraft` showing as `undefined` or `false` when it should be `true`?
- Is the `pageId` missing from the form data?
- Is the page actually marked as draft in Webflow?

### 3. Possible Root Causes

#### A. Webflow API Not Returning `isDraft` Field
- Check if pages API response includes `isDraft` field
- Webflow might use different field name

#### B. Form Has No `pageId`
- If form has no `pageId`, our code keeps it (line 369-371)
- This is the fallback behavior to avoid hiding valid forms

#### C. Page Not Actually Draft in Webflow
- Check in Webflow if page status is actually "Draft"
- Check if it's actually in a draft state vs. just having "Draft" in the name

#### D. Cache Issue
- Browser or API might be returning cached data
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

## What I'm Looking For

Please copy/paste the console logs that show:

1. **All pages and their status:**
   ```
   [Dashboard] 📄 Page: "..." - archived: X, isDraft: Y
   ```

2. **The specific form on Style Guide:**
   ```
   [Dashboard] 🔍 Checking form: "..." on "Style Guide"
   [Dashboard] 🔍 Form full data: { ... }
   ```

3. **The published page IDs set:**
   ```
   [Dashboard] 📄 Published page IDs: [...]
   ```

This will tell me exactly why the form isn't being filtered.

## Expected Fix Scenarios

### Scenario 1: `isDraft` is undefined
**Problem:** Webflow API doesn't return `isDraft` field  
**Solution:** Check for different field name or use alternate detection method

### Scenario 2: Form has no `pageId`
**Problem:** Form isn't associated with a page  
**Solution:** Remove fallback that keeps forms without pageId

### Scenario 3: Page has "[Draft]" in name but isn't actually draft
**Problem:** Page name is misleading  
**Solution:** User needs to actually unpublish the page in Webflow

### Scenario 4: Different field name in API
**Problem:** Webflow uses `draft` or `published` instead of `isDraft`  
**Solution:** Update field check to use correct property name

## Next Steps

1. **Refresh dashboard** and check console
2. **Copy the logs** showing pages and forms
3. **Share with me** so I can identify the exact issue
4. **Apply the fix** based on what we find

---

**Status:** 🔍 Debugging in progress  
**Added:** October 16, 2025



