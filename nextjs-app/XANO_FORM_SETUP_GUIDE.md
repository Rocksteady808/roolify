# Xano Form Sync - Complete Setup Guide

## Current Problem
- Forms from multiple pages aren't tracked properly
- Submissions can't be matched to their correct forms
- Xano only stores form `name`, not `html_form_id` or `site_id`

## Solution Overview
We've updated the code to support proper form tracking. Now you need to update your Xano database schema.

---

## Step 1: Update Xano Form Table

1. **Go to Xano Dashboard** → Your Database → `form` table
2. **Add these new columns**:

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `html_form_id` | text | No | HTML form ID from Webflow (e.g., "wf-form-State-Form") |
| `site_id` | text | No | Webflow site ID |
| `page_url` | text | No | Page URL where form is located |
| `form_fields` | json | No | Array of form fields |
| `updated_at` | timestamp | No | Last sync time |

3. **Save Changes**

---

## Step 2: Test the Fix

### A. Test Webhook (Automatic)
1. Go to your Webflow site
2. Fill out and submit any form
3. Check Xano `form` table - you should see:
   - `html_form_id`: "wf-form-Your-Form"
   - `site_id`: "68bc42f58e22a62ce5c282e0"
   - `page_url`: Full URL

### B. Manual Sync (Optional - Future Feature)
Call the sync API to manually sync all forms:

```bash
curl -X POST http://localhost:1337/api/forms/sync-to-xano \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "68bc42f58e22a62ce5c282e0",
    "forms": [
      {
        "id": "wf-form-State-Form",
        "name": "State Form",
        "htmlId": "wf-form-State-Form",
        "pageUrl": "https://flow-forms-f8b3f7.webflow.io/",
        "fields": []
      }
    ]
  }'
```

---

## Step 3: Verify Everything Works

### Check 1: Form Created Correctly
```sql
SELECT * FROM form WHERE html_form_id = 'wf-form-State-Form';
```

Expected: One row with all fields populated

### Check 2: Submission Linked to Form
```sql
SELECT 
  s.id as submission_id,
  s.form_id,
  f.name as form_name,
  f.html_form_id,
  f.site_id
FROM submission s
JOIN form f ON s.form_id = f.id
ORDER BY s.created_at DESC
LIMIT 5;
```

Expected: Submissions properly linked to forms

### Check 3: Multiple Pages Work
1. Create forms on different pages
2. Submit each form
3. Verify each form has unique `html_form_id` + `site_id` combination

---

## What This Fixes

✅ Forms from all pages tracked separately
✅ Submissions correctly linked to their forms
✅ No duplicate form entries
✅ Support for multiple sites
✅ Better reporting (submissions per form)
✅ Form sync capability for future dashboard feature

---

## Migration Notes

If you already have forms in Xano without `html_form_id`:
1. Old forms will continue to work
2. New submissions will create/update forms with proper IDs
3. Old forms can be manually updated if needed

---

## Need Help?

If you see errors:
1. Check terminal logs for "[Form Sync]" or "[Submission Webhook]"
2. Verify Xano table has all new columns
3. Test with a simple form submission first
4. Check the Xano API logs in their dashboard

---

## Next Steps (Optional)

After this works, we can add:
- Dashboard button to sync all forms at once
- Auto-sync when scanning sites in Designer Extension
- Form management UI (edit, delete forms in dashboard)
- Better form grouping by site/page








