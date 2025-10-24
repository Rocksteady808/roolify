# HBI Form Missing from Rule Builder & Notifications - FIX

## Problem

The **HBI International Inquiry Form** appears in:
- ✅ Dashboard (shows all 4 forms)
- ✅ Form Submissions page
- ❌ Rule Builder (missing)
- ❌ Notifications page (missing)

## Root Cause

The form has the **wrong `site_id`** in the Xano database:

**In Xano (Form ID 105):**
- `site_id`: `68eb5d6db0e34d2e3ed12c0a` ❌ (WRONG)
- `html_form_id`: `wf-form-HBI-International-Inquiry-Form---HBI-International` ✅ (CORRECT)

**Should be:**
- `site_id`: `652b10ed79cbf4ed07a349ed` ✅
- `html_form_id`: `wf-form-HBI-International-Inquiry-Form---HBI-International` ✅ (KEEP AS-IS)

When the Rule Builder and Notifications pages query `/api/forms/xano?siteId=652b10ed79cbf4ed07a349ed`, the HBI form is **filtered out** because it has a different `site_id`.

## Solution Options

### Option 1: Run the Fix Script (Recommended)

1. Get your auth token from browser console:
   ```javascript
   localStorage.getItem('xano_auth_token')
   ```

2. Run the fix script:
   ```bash
   export XANO_AUTH_TOKEN="your-token-here"
   node fix-hbi-form-site-id.js
   ```

3. Refresh the Rule Builder and Notifications pages

### Option 2: Manual Database Update

1. Open Xano database: https://x1zj-piqu-kkh1.n7e.xano.io
2. Navigate to `form` table
3. Find Form ID 105 (HBI International Inquiry Form)
4. Update:
   - `site_id` → `652b10ed79cbf4ed07a349ed`
   - `html_form_id` → Keep as-is (already correct)
5. Save changes
6. Refresh Rule Builder and Notifications pages

### Option 3: Re-sync from Dashboard

1. Navigate to Dashboard for site `652b10ed79cbf4ed07a349ed`
2. Delete the incorrectly synced form (if there's a delete option)
3. Click "Refresh" to re-sync forms from Webflow
4. The sync logic should create/update the form with correct IDs

## Verification

After applying the fix:

1. **Rule Builder:**
   - Navigate to `/rule-builder?siteId=652b10ed79cbf4ed07a349ed`
   - Open "Target Form" dropdown
   - Confirm "HBI International Inquiry Form" appears

2. **Notifications:**
   - Navigate to `/notifications?siteId=652b10ed79cbf4ed07a349ed`
   - Open "Target Form" dropdown
   - Confirm "HBI International Inquiry Form" appears

## Why This Happened

The form was likely synced to Xano when:
- A different site was selected in the UI
- The `site_id` was incorrectly identified during initial sync
- The `html_form_id` was calculated/guessed (`wf-form-HBI-Internation...`) instead of retrieved from Webflow API

## Prevention

To prevent this in the future:
- Always ensure the correct site is selected before syncing forms
- Use Webflow API's form ID directly (don't calculate it)
- The smart sync logic in `lib/xano.ts` should prevent duplicates

