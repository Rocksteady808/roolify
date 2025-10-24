# Xano Database Migration Instructions

## Problem Solved
The issue where notification settings were creating duplicate form records has been fixed by implementing a new architecture that decouples notification settings from the form table.

## What Was Changed

### 1. Code Architecture Updated ✅
- **`lib/xano.ts`**: Added new `site_id` and `html_form_id` fields to NotificationSetting interface
- **`app/api/notifications/route.ts`**: Updated to use new architecture (no form table dependency)
- **`app/api/submissions/webhook/route.ts`**: Updated to lookup settings by site_id + html_form_id
- **New methods added**: `getBySiteAndForm()`, `upsert()` for better data management

### 2. Database Migration Required ⚠️

You need to manually add these columns to your Xano `notification_setting` table:

#### Step 1: Add Columns in Xano Admin
1. Go to your Xano workspace
2. Navigate to the `notification_setting` table
3. Add these columns:
   - `site_id` (Text, Required)
   - `html_form_id` (Text, Required)

#### Step 2: Migrate Existing Data
After adding the columns, run the migration script:

```bash
cd nextjs-app
node migrate-xano-database.js
```

This script will:
- Find all existing notification settings
- Look up their linked forms
- Copy `site_id` and `html_form_id` from the form to the notification setting
- Update the notification setting records

#### Step 3: Create Unique Index (Optional but Recommended)
In your Xano admin, create a unique index on:
- `site_id`
- `html_form_id` 
- `user_id`

This prevents duplicate notification settings for the same form.

## Benefits of New Architecture

✅ **No More Duplicate Forms**: Notification settings no longer trigger form syncing
✅ **Simpler Data Model**: Direct relationship between site + form + user
✅ **Better Performance**: No complex joins needed
✅ **More Reliable**: No race conditions or sync issues
✅ **Easier Debugging**: Clear data relationships

## Testing the Migration

After completing the migration:

1. **Test Creating Notification Settings**:
   - Go to `/notifications` page
   - Select a form and create notification settings
   - Verify no new form records are created in the `form` table

2. **Test Form Submissions**:
   - Submit a form on your Webflow site
   - Verify notifications are sent to the correct recipients
   - Check server logs for successful routing

3. **Verify Data Integrity**:
   - Check that all notification settings have `site_id` and `html_form_id` populated
   - Verify no orphaned notification settings exist

## Rollback Plan

If you need to rollback:
1. The old `form` and `site` columns will still work
2. The code includes fallback logic for backward compatibility
3. You can remove the new columns if needed

## Files Modified

- `lib/xano.ts` - Updated interfaces and methods
- `app/api/notifications/route.ts` - New architecture implementation  
- `app/api/submissions/webhook/route.ts` - Updated lookup logic
- `migrate-xano-database.js` - Migration script
- `XANO_MIGRATION_GUIDE.md` - Detailed technical guide

## Next Steps

1. Add the required columns to your Xano database
2. Run the migration script
3. Test creating notification settings (should not create form records)
4. Test form submissions (should route correctly)
5. Remove old columns after confirming everything works (optional)

