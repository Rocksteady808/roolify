# Notification Settings - Xano Schema

## Problem
Form-specific notification settings (`/notifications/[formId]`) are not being saved - they're just stored in React state and lost on refresh.

## Solution

### 1. Add Xano Table: `notification_setting`

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | integer | Yes (PK) | Auto-increment primary key |
| `created_at` | timestamp | Yes | Auto-generated |
| `form_id` | integer | Yes | FK to `form` table |
| `user_id` | integer | Yes | FK to `user` table |
| `admin_routes` | json | No | Array of admin email routes |
| `user_routes` | json | No | Array of user email routes |
| `admin_fallback_email` | text | No | Fallback admin email |
| `user_fallback_email` | text | No | Fallback user email |
| `updated_at` | timestamp | No | Last update time |

### 2. Route JSON Structure

```json
{
  "id": "uuid",
  "name": "Route 1",
  "conditions": [
    {
      "fieldId": "field-123",
      "operator": "equals",
      "value": "some value"
    }
  ],
  "to": "recipient@example.com",
  "subject": "Custom Subject",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

### 3. API Endpoints Needed

**GET `/api/notifications/form/[formId]`**
- Get notification settings for a specific form
- Returns settings or default values if none exist

**POST `/api/notifications/form/[formId]`**
- Save notification settings for a specific form
- Creates or updates existing settings

### 4. Webhook Integration

When a form is submitted:
1. Get form ID from submission
2. Load notification settings for that form
3. Evaluate conditions against submission data
4. Send emails to matching routes
5. If no routes match, use fallback email

## Benefits

✅ Settings saved per form (not global)
✅ Survives page refresh
✅ Stored in Xano (not local files)
✅ Can be synced across team members
✅ SendGrid integration ready








