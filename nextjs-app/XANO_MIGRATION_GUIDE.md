# Xano Database Migration Guide

## Problem
The current system creates duplicate form records every time notification settings are saved because it tries to sync forms from Webflow. This causes:
- Multiple form records for the same logical form
- Notification settings linked to wrong form IDs
- Race conditions and data inconsistency

## Solution
Decouple notification settings from the form table by storing `site_id` and `html_form_id` directly in the notification_setting table.

## Migration Steps

### 1. Add New Columns to notification_setting Table

Add these columns to your `notification_setting` table in Xano:

```sql
-- Add new columns
ALTER TABLE notification_setting ADD COLUMN site_id TEXT;
ALTER TABLE notification_setting ADD COLUMN html_form_id TEXT;

-- Make them required (set NOT NULL after data migration)
-- ALTER TABLE notification_setting ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE notification_setting ALTER COLUMN html_form_id SET NOT NULL;
```

### 2. Migrate Existing Data

For each existing notification_setting record, copy data from the linked form:

```sql
-- Update existing records with data from linked forms
UPDATE notification_setting 
SET 
  site_id = (SELECT site_id FROM form WHERE form.id = notification_setting.form),
  html_form_id = (SELECT html_form_id FROM form WHERE form.id = notification_setting.form)
WHERE site_id IS NULL OR html_form_id IS NULL;
```

### 3. Create Unique Index

```sql
-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX idx_notification_setting_unique 
ON notification_setting (site_id, html_form_id, user_id);
```

### 4. Test the Migration

1. Verify all notification_setting records have site_id and html_form_id populated
2. Test creating new notification settings (should not create new form records)
3. Test form submission routing (should work with new structure)

### 5. Optional: Remove Old Form FK

After testing, you can optionally remove the old `form` column:

```sql
-- Only after confirming everything works
-- ALTER TABLE notification_setting DROP COLUMN form;
```

## Code Changes Required

The following files need to be updated to use the new structure:

1. `lib/xano.ts` - Update NotificationSetting interface
2. `app/api/notifications/route.ts` - Update GET/POST handlers
3. `app/api/submissions/webhook/route.ts` - Update form matching logic

## Benefits

- ✅ No more duplicate form records
- ✅ Notification settings work independently of form table
- ✅ Simpler, more robust architecture
- ✅ No race conditions during form syncing