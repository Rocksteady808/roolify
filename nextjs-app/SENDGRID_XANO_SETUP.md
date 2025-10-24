# SendGrid + Xano Form Notifications Setup

This guide will help you set up SendGrid email notifications for form submissions using Xano.

## 📋 Overview

When a user submits a form on your Webflow site:
1. **Roolify captures** the submission → Sends to Xano
2. **Xano stores** the submission in the `submission` table
3. **Xano triggers** SendGrid to send email notification
4. **You receive** an email with form details

---

## 🔧 Part 1: Xano Setup

### Step 1: Add SendGrid API Key to Xano

1. **Get your SendGrid API Key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Give it "Full Access" or "Mail Send" permission
   - Copy the key (starts with `SG.`)

2. **Add to Xano Environment Variables**:
   - In Xano, go to **Settings** → **Environment Variables**
   - Click **+ Add Variable**
   - Name: `SENDGRID_API_KEY`
   - Value: Paste your SendGrid API key
   - Save

### Step 2: Create SendGrid Email Function in Xano

Create a new function to send emails via SendGrid:

**Function Name:** `send_form_notification`

**Inputs:**
```json
{
  "form_name": "string",
  "form_id": "string",
  "submission_data": "text",
  "user_email": "string",
  "submitted_at": "text",
  "notification_email": "string"
}
```

**Function Logic:**

```javascript
// Parse submission data if it's a string
let formData = {};
try {
  formData = JSON.parse(submission_data);
} catch (e) {
  formData = { raw: submission_data };
}

// Build email body
let emailBody = `
<h2>New Form Submission</h2>
<p><strong>Form:</strong> ${form_name}</p>
<p><strong>Form ID:</strong> ${form_id}</p>
<p><strong>Submitted At:</strong> ${submitted_at}</p>
<hr />
<h3>Submission Details:</h3>
`;

// Add each field from the form
for (let [key, value] of Object.entries(formData)) {
  if (key !== '_meta') {
    emailBody += `<p><strong>${key}:</strong> ${value}</p>`;
  }
}

// Call SendGrid API
const response = await $fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + env.SENDGRID_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: notification_email }],
      subject: `New ${form_name} Submission`
    }],
    from: {
      email: 'notifications@yourdomain.com', // Change this to your verified sender
      name: 'Roolify Forms'
    },
    content: [{
      type: 'text/html',
      value: emailBody
    }]
  })
});

return { success: true, status: response.status };
```

### Step 3: Update Submission Endpoint to Trigger Notification

Modify your **POST `/submission`** endpoint:

**Current Logic:**
```
1. Receive form data
2. Store in database
3. Return success
```

**New Logic:**
```
1. Receive form data
2. Store in database
3. Call send_form_notification function
4. Return success
```

**Add this after storing submission:**

```javascript
// Get user's notification settings (you'll need to create this table)
const user_settings = await submission.user_id.notification_settings;

// If notifications are enabled, send email
if (user_settings && user_settings.email_notifications_enabled) {
  await send_form_notification({
    form_name: submission.form_id.form_name, // Assuming form_id is a reference
    form_id: submission.form_id.toString(),
    submission_data: submission.submission_data,
    user_email: submission.user_id.email,
    submitted_at: submission.created_at,
    notification_email: user_settings.notification_email || submission.user_id.email
  });
}
```

---

## 🗄️ Part 2: Database Schema Updates

### Table: `notification_settings`

Create a new table to store per-user notification preferences:

```sql
CREATE TABLE notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT REFERENCES user(id),
  email_notifications_enabled BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  notify_on_all_forms BOOLEAN DEFAULT true,
  specific_form_ids TEXT, -- JSON array of form IDs to notify for
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields Explanation:**
- `email_notifications_enabled`: Master toggle for all email notifications
- `notification_email`: Where to send notifications (defaults to user's email)
- `notify_on_all_forms`: If true, send notifications for all forms
- `specific_form_ids`: If `notify_on_all_forms` is false, only notify for these forms

### Update `user` table relationship

Add a one-to-one relationship:
- `user.notification_settings` → `notification_settings.user_id`

---

## 🎨 Part 3: Frontend Integration

### 1. Create Notification Settings Page

**File:** `nextjs-app/app/notifications/settings/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

function NotificationSettingsInner() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email_notifications_enabled: true,
    notification_email: user?.email || '',
    notify_on_all_forms: true,
    specific_form_ids: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        <Sidebar />
        <main className="col-span-9">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h1>

          <form onSubmit={handleSave} className="bg-white border rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-medium text-gray-900">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive emails when forms are submitted</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, email_notifications_enabled: e.target.checked }))}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>

              <hr />

              {/* Notification Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Email Address
                </label>
                <input
                  type="email"
                  value={settings.notification_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="your@email.com"
                  disabled={!settings.email_notifications_enabled}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Where should we send form submission notifications?
                </p>
              </div>

              <hr />

              {/* Notify for all forms */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-medium text-gray-900">All Forms</label>
                  <p className="text-sm text-gray-500">Get notified for all form submissions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify_on_all_forms}
                  onChange={(e) => setSettings(prev => ({ ...prev, notify_on_all_forms: e.target.checked }))}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={!settings.email_notifications_enabled}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving || !settings.email_notifications_enabled}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function NotificationSettings() {
  return (
    <ProtectedRoute>
      <NotificationSettingsInner />
    </ProtectedRoute>
  );
}
```

### 2. Create API Routes for Settings

**File:** `nextjs-app/app/api/notifications/settings/route.ts`

```typescript
import { NextResponse } from 'next/server';
import xano from '@/lib/xano';

export async function GET() {
  try {
    // Get current user's notification settings from Xano
    const settings = await xano.notificationSettings.get();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    
    // Save to Xano
    const updated = await xano.notificationSettings.update(settings);
    
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
```

### 3. Add Methods to Xano Client

**File:** `nextjs-app/lib/xano.ts`

Add this new export:

```typescript
export const xanoNotificationSettings = {
  /**
   * Get notification settings for current user
   */
  async get(): Promise<any> {
    return xanoRequest<any>(`${MAIN_BASE_URL}/notification_settings/me`);
  },

  /**
   * Update notification settings
   */
  async update(settings: any): Promise<any> {
    return xanoRequest<any>(`${MAIN_BASE_URL}/notification_settings/me`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
};

// Update the default export
export default {
  auth: xanoAuth,
  rules: xanoRules,
  activity: xanoActivity,
  plans: xanoPlans,
  submissions: xanoSubmissions,
  notificationSettings: xanoNotificationSettings, // Add this
};
```

---

## 📧 Part 4: SendGrid Configuration

### 1. Verify Sender Identity

1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click **Verify a Single Sender**
3. Enter your email (e.g., `notifications@yourdomain.com`)
4. Check your email and click verification link

### 2. Set Up Domain Authentication (Optional but Recommended)

1. Go to https://app.sendgrid.com/settings/sender_auth/domain
2. Follow the wizard to authenticate your domain
3. Add the provided DNS records to your domain

---

## 🧪 Part 5: Testing

### Test the SendGrid Validation Endpoint

```bash
curl -X POST https://x8ki-letl-twmt.n7.xano.io/api:lDK9yEIt/sendgrid/validate \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "your@email.com",
    "subject": "Test Email from Roolify",
    "body": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

Expected response:
```json
{
  "status": "success"
}
```

### Test Form Submission Notification

1. Submit a test form on your Webflow site
2. Check Xano logs to see if notification was triggered
3. Check your email for the notification

---

## 🎯 Summary

**What you need to do:**

1. ✅ Get SendGrid API key
2. ✅ Add API key to Xano environment variables
3. ✅ Create `send_form_notification` function in Xano
4. ✅ Create `notification_settings` table in Xano
5. ✅ Update POST `/submission` endpoint to trigger notifications
6. ✅ Create notification settings page in Next.js
7. ✅ Verify sender email in SendGrid
8. ✅ Test the complete flow

**Expected Result:**

Every time someone submits a form, you'll receive an email like:

```
Subject: New Contact Form Submission

New Form Submission
Form: Contact Form
Form ID: wf-form-Contact-Form
Submitted At: 2025-10-12 03:45:00

Submission Details:
Name: John Doe
Email: john@example.com
Message: I'd like to learn more about your service
```

---

## 🔗 Related Documentation

- [SendGrid API Docs](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Xano Functions](https://docs.xano.com/functions)
- [Your Xano API Base URL](https://x8ki-letl-twmt.n7.xano.io/api:lDK9yEIt)

---

**Need help?** Check the Xano logs or SendGrid activity dashboard for detailed error messages.








