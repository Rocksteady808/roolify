# Notification System - Complete Setup Guide

## System Overview

Your notification system is **fully configured and ready to use!** Here's how it works:

### Architecture

```
User submits form
    ↓
Webflow sends data to webhook
    ↓
Webhook saves to Xano
    ↓
Webhook loads notification settings (from notifications.json)
    ↓
Evaluates routing rules
    ↓
Sends emails via Xano SendGrid API
    ↓
Recipient receives beautiful HTML email
```

---

## What's Already Set Up

### ✅ 1. **File-Based Storage** (`notifications.json`)
- Notification settings are stored locally in `notifications.json`
- Same approach as your conditional logic rules
- No Xano dependency for storing notification settings
- Settings survive server restarts

### ✅ 2. **SendGrid Integration** (via Xano)
- Connected to: `https://x8ki-letl-twmt.n7.xano.io/api:lDK9yEIt/sendgrid/validate`
- Sends HTML emails with form data
- Beautiful email templates with gradient header
- Automatic formatting of form fields

### ✅ 3. **Notification Settings UI** (`/notifications` page)
- Select a form from dropdown
- Configure admin routing rules (send to different people based on form values)
- Configure user confirmation emails (optional)
- Set fallback emails if no routes match
- Save settings per form

### ✅ 4. **Webhook Processing** (`/api/submissions/webhook`)
- Receives form submissions
- Saves to Xano
- Loads notification settings for that specific form
- Evaluates routing conditions
- Sends emails to matching recipients
- Uses fallback email if no routes match

---

## How to Use It

### Step 1: Configure Notification Settings

1. **Go to**: `http://localhost:1337/notifications`
2. **Select a form** from the dropdown
3. **Add Admin Routing Rules**:
   - **Field**: The form field to check (e.g., "Select a Country")
   - **Operator**: How to match (equals, contains, starts with, ends with)
   - **Value**: The value to match (e.g., "United Kingdom")
   - **Recipients**: Email addresses to send to (comma-separated)

4. **Add Fallback Email** (optional but recommended):
   - This email receives notifications when no routing rules match
   - Example: `admin@yourdomain.com`

5. **Click "Save Settings"**

### Step 2: Test It

1. **Go to your published Webflow site**: `https://flow-forms-f8b3f7.webflow.io/`
2. **Fill out and submit a form**
3. **Watch the terminal logs** - you'll see:
   ```
   [Submission Webhook] ✅ Received submission
   [Email] Processing notification settings
   [Email] Admin route matched - Field: Select a Country Value: United Kingdom
   [Email] Sending email to: your-email@example.com
   [Email] Email sent successfully
   ```
4. **Check your inbox** - you'll receive a beautiful HTML email with the form data!

---

## Notification Settings Structure

### File Location
`nextjs-app/notifications.json`

### Example Settings

```json
[
  {
    "id": "notif_1736668800000_abc123",
    "formId": "wf-form-Country-Form",
    "siteId": "68bc42f58e22a62ce5c282e0",
    "formName": "Country Form",
    "adminRoutes": [
      {
        "id": "route_1",
        "field": "Select a Country",
        "operator": "equals",
        "value": "United Kingdom",
        "recipients": "uk-team@example.com"
      },
      {
        "id": "route_2",
        "field": "Select a Country",
        "operator": "equals",
        "value": "United States",
        "recipients": "us-team@example.com"
      }
    ],
    "userRoutes": [],
    "adminFallbackEmail": "admin@example.com",
    "userFallbackEmail": null,
    "createdAt": "2025-01-12T04:00:00.000Z",
    "updatedAt": "2025-01-12T04:00:00.000Z"
  }
]
```

---

## Routing Rules Explained

### Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match (case-insensitive) | Field = "California" matches "california" or "CALIFORNIA" |
| `contains` | Value contains substring | Field contains "tech" matches "Technology" or "Fintech" |
| `starts_with` | Value starts with | Field starts with "Mr" matches "Mr. Smith" |
| `ends_with` | Value ends with | Field ends with ".com" matches "example.com" |

### How Routing Works

1. **Form is submitted**
2. **System checks each route in order**
3. **For each route**:
   - Check if the field value matches the condition
   - If it matches, add recipients to the email list
4. **Send emails to all matching recipients**
5. **If no routes matched**, use fallback email (if configured)

---

## Email Templates

### Admin Notification Email

**Subject**: `New submission from {Form Name}`

**Content**:
- Purple gradient header
- "New Form Submission" title
- All form fields in a formatted table
- Clean, professional design

### User Confirmation Email

**Subject**: `Thank you for your submission`

**Content**:
- Purple gradient header
- "Submission Received" title
- Copy of submitted data
- Thank you message

---

## Troubleshooting

### Emails Not Sending?

**Check the terminal logs**:

```bash
# Good sign - Settings loaded
[Email] Processing notification settings

# Good sign - Route matched
[Email] Admin route matched - Field: Select a Country Value: United Kingdom

# Good sign - Email sent
[Email] Email sent successfully

# Problem - No settings found
[Email] No notification settings configured for form: wf-form-Country-Form
→ Solution: Go to /notifications and configure settings for this form

# Problem - SendGrid API error
[Email] SendGrid API error: 500 Internal Server Error
→ Solution: Check your SendGrid API key in Xano environment variables
```

### How to Check SendGrid Configuration in Xano

1. **Go to Xano**: https://xano.io
2. **Open your workspace**
3. **Click "Environment Variables"** (top-right gear icon)
4. **Check**:
   - `SENDGRID_API_KEY` - Your SendGrid API key
   - `sendgrid_from_email` - Your verified sender email (e.g., `noreply@yourdomain.com`)
5. **Make sure both are set correctly**
6. **Click "Save"**

---

## Advanced: Multiple Recipients

You can send to multiple people by adding **comma-separated emails**:

```
recipient1@example.com, recipient2@example.com, recipient3@example.com
```

**Example**:
- **Field**: "Department"
- **Operator**: "equals"
- **Value**: "Sales"
- **Recipients**: `sales-manager@example.com, sales-team@example.com, ceo@example.com`

---

## Key Files

| File | Purpose |
|------|---------|
| `nextjs-app/notifications.json` | Stores notification settings |
| `nextjs-app/lib/notificationsStore.ts` | Helper functions for reading/writing settings |
| `nextjs-app/app/notifications/page.tsx` | Notification settings UI |
| `nextjs-app/app/api/notifications/route.ts` | API for saving/loading settings |
| `nextjs-app/app/api/submissions/webhook/route.ts` | Processes submissions & sends emails |

---

## What's NOT Using Xano

- ❌ Notification settings storage (uses `notifications.json`)
- ❌ Routing logic (runs in Next.js webhook)

## What IS Using Xano

- ✅ SendGrid email sending
- ✅ Form submissions storage
- ✅ User authentication
- ✅ Plans & billing

---

## Next Steps

1. **Test the system**:
   - Go to `/notifications`
   - Configure settings for your "Country Form"
   - Submit a test form
   - Check your email

2. **Configure all your forms**:
   - Add notification settings for each form
   - Set up routing rules based on your needs
   - Always add a fallback email as a safety net

3. **Optional: User Confirmation Emails**:
   - Add "User Routes" if you want to send confirmation emails
   - Make sure the form has an email field
   - Use that field value as the recipient

---

## Summary

🎉 **Your notification system is ready to go!**

- ✅ SendGrid connected and working
- ✅ File-based storage (simple, fast, reliable)
- ✅ Beautiful HTML email templates
- ✅ Conditional routing based on form values
- ✅ Fallback emails for safety
- ✅ Complete logging for debugging

**Just configure your settings at `/notifications` and you're done!**







