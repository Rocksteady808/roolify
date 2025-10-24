# Xano Rules Migration Complete

## Summary

Successfully migrated the entire rules system to use Xano database exclusively, eliminating the conflict between local file storage (`rules.json`) and Xano database.

## Changes Made

### 1. Created New Xano Rules Endpoint
**File**: `nextjs-app/app/api/form-rules/route.ts` (NEW)

- Created a global rules endpoint that fetches from Xano
- Supports filtering by `siteId`, `formId`, and `activeOnly` parameters
- Returns rules in the same format as the old `/api/rules` endpoint for compatibility
- Properly parses `rule_data` JSON from Xano and extracts siteId, formId, conditions, actions, etc.

### 2. Updated Unified Script to Use Xano
**File**: `nextjs-app/app/api/script/unified/[siteId]/route.ts`

**Changed** (line 24):
```typescript
// OLD: const rulesResponse = await fetch(`${appUrl}/api/rules?siteId=${siteId}&activeOnly=true`);
// NEW: const rulesResponse = await fetch(`${appUrl}/api/form-rules?siteId=${siteId}&activeOnly=true`);
```

Now the unified script loads rules from Xano instead of the local `rules.json` file.

### 3. Archived Old Local Rules File
**File**: `nextjs-app/rules.json` → `nextjs-app/rules.json.backup-20251018-040552`

- Renamed the old `rules.json` file to prevent it from being loaded
- Preserved the old data as backup in case it's needed for reference

## What This Fixes

### Before (BROKEN)
- **Unified Script**: Loaded 12 old rules from `rules.json` (State/Country forms)
- **Rule Builder**: Showed rules from Xano (HBI form rules)
- **Result**: Console errors for "Select-a-State", "California", "New-York", etc. (fields that don't exist on HBI page)
- **HBI fields**: Showing by default because no rules were found

### After (FIXED)
- **Unified Script**: Loads only relevant rules from Xano for the specific site
- **Rule Builder**: Uses same Xano database
- **Result**: No more "Field not found" errors for non-existent fields
- **HBI fields**: Will be hidden by default (when rules exist in Xano)

## Next Steps

### 1. Create Rules in Xano via Rule Builder

The old rules from `rules.json` are **not automatically migrated** to Xano. You need to create new rules using the Rule Builder:

1. Go to Rule Builder in your app
2. Select the HBI International form
3. Create rules for:
   - **Hide HBI fields by default** (when "Yes" is NOT selected)
   - **Show HBI fields when Yes is selected**
   - **Hide HBI fields when No is selected**

### 2. Test on Live Site

After creating rules in Xano:

1. **Restart your Next.js dev server** (if running locally)
2. **Clear browser cache** or hard reload (Cmd+Shift+R / Ctrl+Shift+F5)
3. **Check browser console** - should see:
   ```
   [Roolify] Rules loaded: X  (where X is the number of active rules for your site)
   ```
4. **Verify behavior**:
   - HBI Account Rep field should be hidden initially
   - Clicking "Yes" should show the field
   - Clicking "No" should hide the field

### 3. Example Rules to Create

**Rule 1: Show HBI fields when Yes is selected**
- **Condition**: `has-account-yes` (radio button) equals `true`
- **Actions**: 
  - Show `HBI-Account-Rep`
  - Show `EIN-Number`

**Rule 2: Hide HBI fields when No is selected**
- **Condition**: `has-account-no` (radio button) equals `true`
- **Actions**:
  - Hide `HBI-Account-Rep`
  - Hide `EIN-Number`

## Technical Details

### Old Architecture
```
┌─────────────────┐
│  Unified Script │ ──> /api/rules ──> rules.json (local file)
└─────────────────┘

┌─────────────────┐
│  Rule Builder   │ ──> /api/form-rules/form/[formId] ──> Xano Database
└─────────────────┘
```

### New Architecture (Xano Only)
```
┌─────────────────┐
│  Unified Script │ ──> /api/form-rules ──> Xano Database
└─────────────────┘

┌─────────────────┐
│  Rule Builder   │ ──> /api/form-rules/form/[formId] ──> Xano Database
└─────────────────┘
```

## Files Modified

1. ✅ `nextjs-app/app/api/form-rules/route.ts` - NEW (global Xano rules endpoint)
2. ✅ `nextjs-app/app/api/script/unified/[siteId]/route.ts` - Updated to use Xano
3. ✅ `nextjs-app/rules.json` - Archived to `rules.json.backup-*`

## Verification

To verify the fix is working:

```bash
# Check that old rules.json is archived
ls -la nextjs-app/rules.json*

# Should show: rules.json.backup-20251018-040552 (or similar timestamp)
# Should NOT show: rules.json (original file)
```

When your dev server is running:

```bash
# Test the new Xano endpoint
curl "http://localhost:1337/api/form-rules?siteId=68eb5d6db0e34d2e3ed12c0a&activeOnly=true"

# Should return rules from Xano, not local file
```

## Troubleshooting

### If rules still aren't loading:

1. **Check Xano has rules**: Use Rule Builder to verify rules exist in Xano
2. **Verify siteId**: Ensure rules in Xano have `siteId: 68eb5d6db0e34d2e3ed12c0a`
3. **Check console logs**: Look for `[GET /form-rules]` messages in server logs
4. **Clear cache**: Browser cache can cause old scripts to be loaded

### If you see "Rules loaded: 0":

This means there are no active rules in Xano for your site ID. Create rules using the Rule Builder.

## Success Criteria

✅ No more console errors about "Select-a-State" or other non-existent fields
✅ Console shows correct number of rules loaded from Xano
✅ HBI Account Rep field behavior matches your conditional logic rules
✅ Rule Builder and Live Site use the same data source (Xano)

---

**Migration completed**: October 18, 2025
**Backup file**: `rules.json.backup-20251018-040552`

