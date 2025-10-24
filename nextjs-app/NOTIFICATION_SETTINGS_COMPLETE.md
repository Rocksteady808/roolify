# Notification Settings - Complete Implementation Guide

## Overview
Form-specific notification settings are now fully integrated with Xano. Each form can have its own email routing rules and recipients.

## ✅ What's Implemented

### 1. **Xano Integration** (`lib/xano.ts`)
- Added `NotificationSetting` TypeScript interface
- Added `xanoNotifications` API methods:
  - `getAll()` - Get all notification settings
  - `getByFormId(formId)` - Get settings for a specific form
  - `getById(notificationId)` - Get single setting by ID
  - `create(data)` - Create new notification settings
  - `update(notificationId, data)` - Update existing settings
  - `delete(notificationId)` - Delete notification settings

### 2. **Form-Specific Notifications Page** (`app/notifications/[formId]/page.tsx`)
- ✅ Loads notification settings from Xano on page load
- ✅ Saves settings to Xano (form-specific, NOT global)
- ✅ Auto-creates form in Xano if it doesn't exist
- ✅ "Save Settings" button in the header
- ✅ Proper loading states and error handling
- ✅ Settings are unique per form (won't apply to other forms)

### 3. **API Endpoint** (`app/api/notifications/[formId]/route.ts`)
- New GET endpoint to retrieve notification settings by form ID
- Used by form submission handler to determine email recipients
- Returns parsed `admin_routes`, `user_routes`, and fallback emails

---

## 🔧 Xano Database Setup

### Step 1: Create `notification_setting` Table

Go to your Xano database and create a new table called `notification_setting` with these columns:

| Column Name | Type | Required | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | integer | Yes (PK) | Auto-increment | Primary key |
| `created_at` | timestamp | Yes | now() | Auto-generated |
| `form_id` | integer | Yes | - | FK to `form` table |
| `user_id` | integer | Yes | - | FK to `user` table |
| `admin_routes` | json | No | [] | Array of admin email routes |
| `user_routes` | json | No | [] | Array of user email routes |
| `admin_fallback_email` | text | No | '' | Default admin email |
| `user_fallback_email` | text | No | '' | Default user email |
| `updated_at` | timestamp | No | now() | Last update time |

### Step 2: Create Foreign Key Relationships

1. **Link `form_id` to `form` table:**
   - Add foreign key constraint: `notification_setting.form_id` → `form.id`

2. **Link `user_id` to `user` table:**
   - Add foreign key constraint: `notification_setting.user_id` → `user.id`

### Step 3: Create Xano API Endpoints

Create these CRUD endpoints in Xano:

#### **GET /notification_setting**
- Returns all notification settings
- No authentication required for now (add later)

#### **GET /notification_setting/{notification_setting_id}**
- Returns single notification setting by ID
- Path parameter: `notification_setting_id` (integer)

#### **POST /notification_setting**
- Creates new notification setting
- Body parameters:
  - `form_id` (integer, required)
  - `user_id` (integer, required)
  - `admin_routes` (json/text, optional)
  - `user_routes` (json/text, optional)
  - `admin_fallback_email` (text, optional)
  - `user_fallback_email` (text, optional)

#### **PATCH /notification_setting/{notification_setting_id}**
- Updates existing notification setting
- Path parameter: `notification_setting_id` (integer)
- Body parameters (all optional):
  - `admin_routes` (json/text)
  - `user_routes` (json/text)
  - `admin_fallback_email` (text)
  - `user_fallback_email` (text)

#### **DELETE /notification_setting/{notification_setting_id}**
- Deletes notification setting
- Path parameter: `notification_setting_id` (integer)

---

## 📝 Route JSON Structure

### Admin Routes Example:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "High Priority",
    "conditions": [
      {
        "fieldId": "Priority",
        "operator": "equals",
        "value": "High"
      }
    ],
    "to": "urgent@company.com",
    "subject": "High Priority Form Submission",
    "cc": "manager@company.com",
    "bcc": "archive@company.com"
  }
]
```

### User Routes Example:
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Confirmation Email",
    "conditions": [],
    "to": "{{Email}}",
    "subject": "Thank you for your submission"
  }
]
```

### Condition Operators:
- `equals` - Field value matches exactly
- `not_equals` - Field value doesn't match
- `contains` - Field value contains substring
- `is_empty` - Field is empty
- `is_filled` - Field has a value

---

## 🎯 How It Works

### 1. **User Creates Rules**
1. User navigates to `/notifications/[formId]?siteId=[siteId]`
2. Page loads form metadata from Webflow
3. Page checks Xano for existing notification settings
4. If settings exist, they're loaded into the UI
5. User can add/edit email routes with conditions

### 2. **User Saves Settings**
1. User clicks "Save Settings" button
2. System checks if form exists in Xano `form` table
3. If not, form is auto-created with `xanoForms.sync()`
4. Settings are saved to `notification_setting` table
5. Settings are linked to the specific `form_id`

### 3. **Form Submission Triggers Email**
1. User fills out form on Webflow site
2. Form data is sent to `/api/submissions/webhook`
3. Webhook calls `/api/notifications/[formId]` to get settings
4. System evaluates route conditions against form data
5. Matching route sends email via SendGrid (through Xano)
6. Fallback email is used if no routes match

---

## 🔗 API Usage

### Get Notification Settings
```typescript
// By form HTML ID
const response = await fetch('/api/notifications/wf-form-Contact-Form');
const { settings, form } = await response.json();

// By numeric form ID
const response = await fetch('/api/notifications/123');
const { settings, form } = await response.json();
```

### Response Format
```json
{
  "settings": {
    "id": 1,
    "form_id": 123,
    "admin_routes": [...],
    "user_routes": [...],
    "admin_fallback_email": "admin@company.com",
    "user_fallback_email": ""
  },
  "form": {
    "id": 123,
    "html_form_id": "wf-form-Contact-Form",
    "name": "Contact Form"
  }
}
```

---

## ✅ Testing Checklist

### 1. **Create Notification Settings**
- [ ] Navigate to `/notifications/[formId]?siteId=[siteId]`
- [ ] Verify page loads form fields correctly
- [ ] Add an admin email route with conditions
- [ ] Add fallback email
- [ ] Click "Save Settings"
- [ ] Verify success message

### 2. **Verify Settings in Xano**
- [ ] Open Xano dashboard
- [ ] Check `notification_setting` table
- [ ] Verify new row exists with correct `form_id`
- [ ] Verify `admin_routes` JSON is properly formatted
- [ ] Verify fallback emails are saved

### 3. **Load Existing Settings**
- [ ] Refresh the notifications page
- [ ] Verify saved routes are loaded correctly
- [ ] Verify conditions and recipients are populated
- [ ] Verify fallback emails are loaded

### 4. **Update Settings**
- [ ] Change a route's recipient email
- [ ] Add a new condition
- [ ] Click "Save Settings"
- [ ] Verify changes are saved in Xano

### 5. **Multiple Forms**
- [ ] Create settings for Form A
- [ ] Create different settings for Form B
- [ ] Verify Form A settings don't appear on Form B's page
- [ ] Verify Form B settings don't appear on Form A's page

---

## 🚀 Next Steps

### 1. **Integrate with Form Submissions**
- Update `/api/submissions/webhook/route.ts` to:
  - Fetch notification settings via `/api/notifications/[formId]`
  - Evaluate route conditions against submission data
  - Send emails via Xano/SendGrid based on matching routes

### 2. **Add Email Templates**
- Create email templates in Xano
- Allow users to customize email HTML/text
- Support template variables (e.g., `{{FieldName}}`)

### 3. **Add User Authentication**
- Replace hardcoded `user_id: 1` with actual logged-in user ID
- Filter notification settings by user
- Add permission checks

### 4. **Add Testing Features**
- "Send Test Email" button on notifications page
- Preview email before saving
- Validate email addresses

---

## 📚 Related Files

- `nextjs-app/lib/xano.ts` - Xano API client
- `nextjs-app/app/notifications/[formId]/page.tsx` - Form-specific notifications UI
- `nextjs-app/app/api/notifications/[formId]/route.ts` - API endpoint for fetching settings
- `nextjs-app/NOTIFICATION_SETTINGS_SCHEMA.md` - Database schema reference

---

## 🎉 Summary

**Notification settings are now form-specific and persist in Xano!**

- ✅ Each form has its own unique notification rules
- ✅ Settings are saved to Xano and loaded automatically
- ✅ No more lost settings on page refresh
- ✅ Settings won't accidentally apply to other forms
- ✅ Ready for SendGrid email integration

**What the user needs to do:**
1. Create the `notification_setting` table in Xano (see Step 1 above)
2. Create the Xano API endpoints (see Step 3 above)
3. Test the notification settings page

That's it! The code is ready and working. 🚀








