# Xano Form Sync Fix

## Problem
Forms from multiple pages aren't being properly tracked in Xano because:
1. The `form` table only has `name` field, no `html_form_id` or `site_id`
2. Forms are only created when submissions arrive (not proactively synced)
3. Multiple forms with the same name from different pages can conflict

## Solution

### 1. Update Xano Form Table Schema

Add these fields to your `form` table in Xano:

```
html_form_id: text (required) - The HTML form ID from Webflow (e.g., "wf-form-State-Form")
site_id: text (required) - The Webflow site ID
page_url: text - The page URL where the form is located
form_fields: json - Array of form fields
updated_at: timestamp - Last sync time
```

### 2. Update Xano API Endpoints

Create a new endpoint in Xano:

**Endpoint**: `POST /form/sync`
**Purpose**: Sync forms from Webflow to Xano

**Parameters**:
- `html_form_id` (text, required)
- `name` (text, required) 
- `site_id` (text, required)
- `page_url` (text)
- `form_fields` (json)
- `user_id` (integer, required)

**Logic**:
1. Check if form exists by `html_form_id` AND `site_id`
2. If exists: UPDATE the form
3. If not: CREATE new form
4. Return the form record

### 3. Form Sync Flow

```
1. User scans site in Designer Extension
   ↓
2. App detects all forms from all pages
   ↓
3. For each form:
   - Call POST /form/sync with form details
   - Store form in Xano with html_form_id + site_id
   ↓
4. When submission arrives at webhook:
   - Find form by html_form_id + site_id
   - Associate submission with correct form
```

## Implementation Steps

1. **Update Xano Schema** (Do this first in Xano dashboard)
2. **Update TypeScript Types** (in `lib/xano.ts`)
3. **Create Sync API Endpoint** (in `app/api/forms/sync/route.ts`)
4. **Update Webhook** (to use html_form_id for matching)
5. **Add Sync Button** (to dashboard for manual syncing)

## Benefits

✅ Forms from all pages properly tracked
✅ No duplicate form entries
✅ Submissions correctly associated with their forms
✅ Better reporting and analytics
✅ Support for multiple sites








