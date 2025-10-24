# Clean Forms and Re-sync Guide

## Problem

The HBI form (and possibly others) have incorrect `site_id` values in the Xano database, causing them to not appear in rule builder and notifications pages.

## Solution: Clean Slate Approach

Instead of trying to fix individual records, we'll:
1. **Delete all forms** for the site from Xano
2. **Re-sync from Webflow** with correct data

This ensures all forms get the correct `site_id` and `html_form_id` from the start.

## Steps

### Step 1: Run the Clean Script

```bash
# Get your auth token from browser console
# localStorage.getItem('xano_auth_token')

export XANO_AUTH_TOKEN="your-token-here"
node clean-forms-and-resync.js
```

### Step 2: Re-sync from Dashboard

1. **Navigate to Dashboard**
   - Go to your dashboard
   - Make sure you're on the correct site (`652b10ed79cbf4ed07a349ed`)

2. **Refresh Forms**
   - Click the "Refresh" button
   - This will trigger the form sync process
   - Forms will be created with correct `site_id` and `html_form_id`

3. **Verify Forms Appear**
   - Check that all 4 forms appear in dashboard
   - Navigate to Rule Builder - all forms should be in dropdown
   - Navigate to Notifications - all forms should be in dropdown

## What This Fixes

- ✅ **Correct site_id**: All forms will have `652b10ed79cbf4ed07a349ed`
- ✅ **Correct html_form_id**: Forms will use Webflow API IDs (e.g., `68f648d669c38f6206830743`)
- ✅ **No duplicates**: Clean slate prevents duplicate form records
- ✅ **Consistent data**: All forms synced at the same time with same logic

## Expected Results

After re-sync, you should see:

**Dashboard:**
- HBI International Inquiry Form - HBI International
- Logo Questionnaire  
- Contact Form
- Email Form

**Rule Builder & Notifications:**
- All 4 forms appear in "Target Form" dropdown
- No missing forms

## Why This Approach is Better

1. **Clean slate**: No legacy incorrect data
2. **Consistent**: All forms synced with same logic
3. **Future-proof**: Prevents similar issues
4. **Simple**: One script + one refresh vs. manual database edits

## Troubleshooting

If forms still don't appear after re-sync:

1. **Check site selection**: Make sure you're on the right site in dashboard
2. **Check Webflow connection**: Ensure OAuth tokens are valid
3. **Check logs**: Look for errors in browser console or server logs
4. **Manual sync**: Try the "Sync Forms" button if available

## Alternative: Manual Database Clean

If you prefer to clean manually:

1. Open Xano database
2. Go to `form` table  
3. Delete all records where `site_id = '652b10ed79cbf4ed07a349ed'`
4. Refresh dashboard to re-sync
