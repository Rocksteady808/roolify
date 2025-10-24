# File-Based Notification Storage

## Overview

The notification system has been converted from **Xano database storage** to **local JSON file storage**, matching the approach used for conditional logic rules (`rules.json`).

## Benefits

✅ **Simpler** - No Xano dependency for notifications  
✅ **Faster** - No network calls to fetch settings  
✅ **Self-contained** - Everything stays in your Next.js app  
✅ **Easier to backup** - Just one JSON file  
✅ **Works offline** - No internet required for local dev  
✅ **SendGrid still works** - Emails are still sent via Xano SendGrid endpoint

---

## What Changed

### 1. **New Files Created**

#### `nextjs-app/notifications.json`
Stores all notification settings for all forms:
```json
[
  {
    "id": "notif_1234567890_abc123",
    "formId": "wf-form-Country-Form",
    "siteId": "68bc42f58e22a62ce5c282e0",
    "formName": "Country Form",
    "adminRoutes": [
      {
        "field": "Select a Country",
        "operator": "equals",
        "value": "United Kingdom",
        "recipients": "uk-admin@example.com"
      }
    ],
    "userRoutes": [],
    "adminFallbackEmail": "admin@example.com",
    "userFallbackEmail": null,
    "createdAt": "2025-01-10T...",
    "updatedAt": "2025-01-10T..."
  }
]
```

#### `nextjs-app/lib/notificationsStore.ts`
Helper functions for reading/writing notification settings:
- `loadNotifications()` - Load all settings
- `saveNotifications(notifications)` - Save all settings
- `getNotificationsByFormId(formId)` - Get settings for a specific form
- `upsertNotification(settings)` - Create or update settings
- `deleteNotification(formId, siteId)` - Delete settings

---

### 2. **Files Updated**

#### `nextjs-app/app/api/notifications/route.ts`
- **Before**: Complex Xano integration with fallback to default settings
- **After**: Simple file-based storage using `notificationsStore.ts`
- GET endpoint now returns settings from JSON file
- POST endpoint now saves to JSON file

#### `nextjs-app/app/notifications/page.tsx`
- **Before**: Made multiple API calls to sync form to Xano, check existing settings, then save
- **After**: Single POST to `/api/notifications` with simplified payload
- Removed `syncResponse` and `numericFormId` logic
- Cleaner, simpler save function

#### `nextjs-app/app/api/submissions/webhook/route.ts`
- **Before**: Made HTTP request to `/api/notifications/[formId]` to fetch settings from Xano
- **After**: Directly imports and calls `getNotificationsByFormId()` from `notificationsStore.ts`
- No network calls needed - reads from local file
- Updated to match new route structure (`adminRoutes`, `userRoutes` with `field`, `operator`, `value`, `recipients`)

---

## How It Works Now

### 1. **Saving Notification Settings**

When you configure notifications on the `/notifications` page:

1. User selects a form
2. User configures admin routing rules (if Select a Country = United Kingdom → send to uk-admin@example.com)
3. User clicks "Save Settings"
4. Frontend sends POST to `/api/notifications`:
   ```json
   {
     "formId": "wf-form-Country-Form",
     "siteId": "68bc42f58e22a62ce5c282e0",
     "formName": "Country Form",
     "adminRoutes": [...],
     "userRoutes": [],
     "adminRecipients": "admin@example.com",
     "userRecipients": null
   }
   ```
5. API calls `upsertNotification()` which:
   - Loads `notifications.json`
   - Finds existing settings for this form (or creates new)
   - Updates the settings
   - Saves back to `notifications.json`

### 2. **Sending Notification Emails**

When a form is submitted:

1. User submits form on Webflow site
2. Unified script captures submission
3. Script POSTs to `/api/submissions/webhook`
4. Webhook:
   - Saves submission to Xano
   - Calls `sendNotificationEmails(formId, formData, formName)`
5. `sendNotificationEmails()`:
   - Calls `getNotificationsByFormId(formId)` to load settings from `notifications.json`
   - Evaluates each route condition against form data
   - Collects all matching recipient emails
   - Sends emails via Xano SendGrid endpoint (when configured)

---

## Data Structure

### NotificationSettings Interface

```typescript
export interface NotificationRoute {
  field: string;                           // Form field name
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with';
  value: string;                           // Condition value
  recipients: string;                      // Comma-separated emails
}

export interface NotificationSettings {
  id: string;                              // Unique ID (auto-generated)
  formId: string;                          // HTML form ID (e.g., "wf-form-Country-Form")
  siteId: string;                          // Webflow site ID
  formName: string;                        // Human-readable form name
  adminRoutes: NotificationRoute[];        // Conditional routing for admins
  userRoutes: NotificationRoute[];         // Conditional routing for users
  adminFallbackEmail: string | null;       // Default admin email
  userFallbackEmail: string | null;        // Default user confirmation email
  createdAt: string;                       // ISO timestamp
  updatedAt: string;                       // ISO timestamp
}
```

---

## Migration Notes

### What You DON'T Need Anymore

❌ Xano `notification_setting` table  
❌ Xano notification API endpoints (GET, POST, PUT, DELETE)  
❌ Xano `GET /notification_setting/by_form/{form_id}` custom endpoint  
❌ Network calls to fetch notification settings  

### What You STILL NEED

✅ Xano for **user authentication**  
✅ Xano for **form submissions storage**  
✅ Xano for **SendGrid email sending** (when you configure it)  
✅ Xano for **plans & billing**  

---

## Testing

1. **Configure notifications:**
   - Go to `/notifications`
   - Select a form
   - Add routing rules (e.g., if Country = UK → send to uk@example.com)
   - Add fallback email
   - Click Save

2. **Verify storage:**
   - Open `nextjs-app/notifications.json`
   - You should see your settings

3. **Test form submission:**
   - Submit a form on your Webflow site
   - Check terminal logs:
     ```
     [Email] Processing notification settings
     [Email] Admin route matched - Field: Select a Country Value: United Kingdom
     [Email] Sending to 1 admin recipient(s)
     [Email] Would send email: { to: 'uk@example.com', subject: '...', type: 'admin' }
     ```

4. **Enable actual email sending:**
   - Uncomment the `fetch()` call in `sendEmailViaXano()` function
   - Configure your Xano SendGrid endpoint
   - Test again

---

## File Locations

```
nextjs-app/
├── notifications.json                         # ← Storage file (like rules.json)
├── lib/
│   └── notificationsStore.ts                 # ← Helper functions
├── app/
│   ├── api/
│   │   ├── notifications/
│   │   │   └── route.ts                      # ← Updated to use file storage
│   │   └── submissions/
│   │       └── webhook/
│   │           └── route.ts                  # ← Updated to read from file
│   └── notifications/
│       └── page.tsx                          # ← Updated to save to file
```

---

## Summary

Your notification system now works **exactly like your conditional logic system**:

| Feature | Conditional Logic | Notifications |
|---------|------------------|---------------|
| Storage | `rules.json` | `notifications.json` |
| Helper | `rulesStore.ts` | `notificationsStore.ts` |
| API | `/api/rules` | `/api/notifications` |
| Execution | Client-side script | Server-side webhook |

**No Xano complexity. Just simple, fast, local JSON files!** 🎉








