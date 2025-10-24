# Xano Notification Settings Setup - Quick Guide

## 🎯 Quick Start (5 Minutes)

Follow these steps to set up notification settings in Xano:

---

## Step 1: Create Database Table (2 min)

1. **Go to Xano Dashboard** → Database → Add Table
2. **Name:** `notification_setting`
3. **Add these columns:**

### Columns:

```
✅ id (integer, Primary Key, Auto-increment)
✅ created_at (timestamp, Default: now(), Required)
✅ form_id (integer, Required)
✅ user_id (integer, Required)
✅ admin_routes (json, Optional)
✅ user_routes (json, Optional)
✅ admin_fallback_email (text, Optional)
✅ user_fallback_email (text, Optional)
✅ updated_at (timestamp, Optional)
```

### Foreign Keys:
- Link `form_id` → `form.id` (ON DELETE CASCADE)
- Link `user_id` → `user.id` (ON DELETE CASCADE)

**Click "Save Table"**

---

## Step 2: Create API Endpoints (3 min)

Go to **API** → **Add Endpoint** for each of these:

### 1️⃣ GET All Notification Settings
```
Method: GET
Path: /notification_setting
Returns: All notification_setting records
No inputs required
```

### 2️⃣ GET Single Notification Setting
```
Method: GET
Path: /notification_setting/{notification_setting_id}
Input: notification_setting_id (integer, from path)
Returns: Single notification_setting record
```

### 3️⃣ POST Create Notification Setting
```
Method: POST
Path: /notification_setting
Inputs (from body):
  - form_id (integer, required)
  - user_id (integer, required)
  - admin_routes (text/json, optional)
  - user_routes (text/json, optional)
  - admin_fallback_email (text, optional)
  - user_fallback_email (text, optional)
Returns: Created notification_setting record
```

### 4️⃣ PATCH Update Notification Setting
```
Method: PATCH
Path: /notification_setting/{notification_setting_id}
Inputs:
  - notification_setting_id (integer, from path)
  - admin_routes (text/json, optional, from body)
  - user_routes (text/json, optional, from body)
  - admin_fallback_email (text, optional, from body)
  - user_fallback_email (text, optional, from body)
Returns: Updated notification_setting record
```

### 5️⃣ DELETE Notification Setting
```
Method: DELETE
Path: /notification_setting/{notification_setting_id}
Input: notification_setting_id (integer, from path)
Returns: Success message
```

---

## Step 3: Test in Your App

1. **Navigate to:** `http://localhost:1337/notifications/[formId]?siteId=[siteId]`
   - Replace `[formId]` with your actual form ID (e.g., `wf-form-Contact-Form`)
   - Replace `[siteId]` with your Webflow site ID

2. **Add an admin email route:**
   - Click "+ Add route"
   - Set a condition (e.g., "Priority equals High")
   - Enter recipient email
   - Click "Save Settings"

3. **Check Xano:**
   - Go to Xano → Database → `notification_setting` table
   - You should see a new row with your settings!

---

## 📝 Example Data Structure

### Admin Routes (JSON):
```json
[
  {
    "id": "abc-123",
    "name": "High Priority",
    "conditions": [
      {
        "fieldId": "Priority",
        "operator": "equals",
        "value": "High"
      }
    ],
    "to": "urgent@company.com",
    "subject": "Urgent Form Submission",
    "cc": "manager@company.com",
    "bcc": ""
  }
]
```

### User Routes (JSON):
```json
[
  {
    "id": "def-456",
    "name": "Thank You Email",
    "conditions": [],
    "to": "{{Email}}",
    "subject": "Thank you for contacting us"
  }
]
```

---

## 🚨 Troubleshooting

### Issue: "Failed to save notification settings"
**Fix:** Make sure all Xano endpoints are created and published

### Issue: "Form not found"
**Fix:** Make sure the `form` table exists and has the new columns:
- `html_form_id` (text)
- `site_id` (text)
- `page_url` (text)
- `form_fields` (json)
- `updated_at` (timestamp)

### Issue: Settings not loading
**Fix:** Check browser console for errors. Make sure Xano API is returning data correctly.

---

## ✅ Verification Checklist

- [ ] `notification_setting` table created in Xano
- [ ] All 9 columns added to table
- [ ] Foreign keys linked to `form` and `user` tables
- [ ] 5 API endpoints created and published
- [ ] Tested creating notification settings in the app
- [ ] Verified settings are saved in Xano database
- [ ] Tested loading settings on page refresh
- [ ] Tested updating existing settings

---

## 🎉 You're Done!

Your notification settings are now:
- ✅ Saved to Xano database
- ✅ Form-specific (won't apply to other forms)
- ✅ Persistent (won't be lost on refresh)
- ✅ Ready for SendGrid email integration

**Next Step:** Set up SendGrid for actual email sending (see `Send Grid Schema.MD`)








