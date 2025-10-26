# Xano Database User Isolation Setup

## Overview

This document provides step-by-step instructions for adding user isolation filters to all Xano API endpoints. These filters provide database-level security (defense in depth) to prevent users from accessing other users' data.

## Prerequisites

- Access to your Xano dashboard
- Admin permissions to modify API endpoints
- Understanding of how Xano's authentication system works

## Critical Endpoints to Configure

You need to add user filtering to the following API endpoints:

1. ✅ `/form` - Forms table
2. ✅ `/logic_rule` - Rules table
3. ✅ `/site` - Sites table
4. ✅ `/submission` - Submissions table
5. ✅ `/activity` - Activity logs
6. ✅ `/notification_setting` - Notification settings

## Step-by-Step Instructions

### For Each API Endpoint (Repeat 6 Times)

#### Step 1: Navigate to the API Endpoint

1. Open your Xano dashboard
2. Click **API** in the left sidebar
3. Find and click the endpoint you want to configure (e.g., **GET /form**)
4. You should see the Function Stack editor

#### Step 2: Add Filter Step

1. In the Function Stack, look for existing steps
2. Click **Add Step** button
3. Select **Filter** from the list of available functions
4. The Filter function will appear in your stack

#### Step 3: Configure the Filter

For tables that use `user_id` field:
- **Field:** `user_id`
- **Operator:** `equals`
- **Value:** `{auth.user.id}` (or select from dropdown: Auth → User → ID)

For tables that use `user` field (notification_setting, activity):
- **Field:** `user`
- **Operator:** `equals`
- **Value:** `{auth.user.id}` (or select from dropdown: Auth → User → ID)

#### Step 4: Save and Test

1. Click **Save** to save your changes
2. Click **Run** to test the endpoint
3. You should only see data belonging to the authenticated user
4. Repeat for other API endpoints

## Quick Reference: Filter Configurations

### Table: `form`
```
Filter: user_id = {auth.user.id}
```

### Table: `logic_rule`
```
Filter: user_id = {auth.user.id}
```

### Table: `site`
```
Filter: user_id = {auth.user.id}
```

### Table: `submission`
```
Filter: user_id = {auth.user.id}
```

### Table: `activity`
```
Filter: user = {auth.user.id}
```

### Table: `notification_setting`
```
Filter: user = {auth.user.id}
```

## Security Benefits

✅ **Database-Level Protection**: Even if application code has bugs, Xano won't return unauthorized data

✅ **Direct API Access Protection**: Prevents users from bypassing your Next.js app and calling Xano directly

✅ **Defense in Depth**: Two layers of security (Application + Database)

✅ **Future-Proof**: All new queries automatically respect user isolation

✅ **Compliance Ready**: Meets SOC 2 / GDPR data isolation requirements

## Testing

After configuring all endpoints:

1. **Create Two Test Accounts**
   - User A: Connect site, create forms/rules
   - User B: Login, verify sees ZERO data from User A

2. **Direct API Testing**
   - Use browser dev tools to get auth tokens
   - Call Xano API directly with User A's token
   - Should only return User A's data

3. **Dashboard Verification**
   - Login as User A → See only User A's data
   - Login as User B → See only User B's data

## Troubleshooting

**Issue: Filter not working**
- Verify the field name matches exactly (`user_id` vs `user`)
- Check that auth token is being passed correctly
- Test with a known user ID first

**Issue: Getting empty results**
- Temporarily remove filter to verify data exists
- Check that `{auth.user.id}` is correctly populated
- Verify user authentication is working

**Issue: Type mismatch**
- Ensure using numeric comparison (not string)
- Check field types match between filter and database

## Important Notes

⚠️ **Backup First**: Consider backing up your Xano configuration before making changes

⚠️ **Test Thoroughly**: Test each endpoint individually to ensure filters work correctly

⚠️ **Monitor Logs**: Check Xano logs for any filter-related errors

⚠️ **Document Changes**: Keep track of which endpoints you've updated

## Support

If you encounter issues:

1. Check Xano documentation: https://docs.xano.com
2. Review your authentication setup
3. Verify JWT token contains correct user information
4. Test with simplified filters first

## Completion Checklist

- [ ] Configured filter for `/form` endpoint
- [ ] Configured filter for `/logic_rule` endpoint
- [ ] Configured filter for `/site` endpoint
- [ ] Configured filter for `/submission` endpoint
- [ ] Configured filter for `/activity` endpoint
- [ ] Configured filter for `/notification_setting` endpoint
- [ ] Tested all endpoints with authenticated requests
- [ ] Verified data isolation with multiple user accounts
- [ ] Documented any custom configurations

---

**Status**: Application-level security ✅ Complete  
**Status**: Database-level security ⏳ Pending Xano dashboard configuration
