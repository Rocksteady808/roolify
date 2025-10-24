# Form Submission Capture System

## Overview

The Roolify form submission capture system automatically captures and stores all form submissions from your Webflow site into your Xano database. This allows you to view, manage, and analyze all form submissions in one centralized location.

## How It Works

1. **Client-Side Script**: A lightweight JavaScript script is added to your Webflow site that listens for form submissions
2. **Webhook Endpoint**: When a form is submitted, the script sends the data to your Roolify webhook endpoint
3. **Xano Storage**: The webhook processes and stores the submission data in your Xano database
4. **Dashboard Viewing**: View all submissions in the Roolify dashboard's "Form Submissions" page

## Installation

### Step 1: Get Your Site ID

1. Navigate to the **Setup** page in Roolify
2. Your Site ID will be auto-detected and displayed
3. Copy it for reference (you'll need it in Step 3)

### Step 2: Add the Script to Webflow

1. In Webflow Designer, go to **Project Settings → Custom Code**
2. Scroll to the **Footer Code** section
3. Copy the submission capture script from the Setup page:

```html
<!-- Roolify Form Submission Capture -->
<script src="https://your-domain.com/api/submissions/script/YOUR-SITE-ID"></script>
```

4. Paste it in the Footer Code section
5. **Publish** your Webflow site

### Step 3: Test the Integration

1. Visit your published Webflow site
2. Submit a form
3. Go to **Form Submissions** in Roolify
4. You should see your test submission appear

## API Endpoints

### GET `/api/submissions/script/[siteId]`

Serves a dynamically configured JavaScript file that captures form submissions.

**Parameters:**
- `siteId` (path parameter): Your Webflow site ID

**Returns:** JavaScript file (application/javascript)

**Example:**
```
GET /api/submissions/script/68bc42f58e22a62ce5c282e0
```

### POST `/api/submissions/webhook`

Receives form submission data and stores it in Xano.

**Request Body:**
```json
{
  "formId": "wf-form-Contact-Form",
  "formName": "Contact Form",
  "siteId": "68bc42f58e22a62ce5c282e0",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  },
  "timestamp": "2025-10-11T22:00:00.000Z",
  "pageUrl": "https://yoursite.com/contact",
  "pageTitle": "Contact Us"
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": 123,
  "message": "Submission received and stored"
}
```

### GET `/api/submissions/webhook`

Verifies the webhook endpoint is active.

**Response:**
```json
{
  "message": "Webflow Form Submission Webhook Endpoint",
  "endpoint": "/api/submissions/webhook",
  "method": "POST",
  "status": "active"
}
```

## Data Structure

Submissions are stored in Xano with the following structure:

```typescript
{
  id: number;              // Auto-generated submission ID
  created_at: number;      // Unix timestamp
  submission_data: string; // JSON string of form data
  form_id: number;         // Reference to form
  user_id: number;         // Reference to site owner
}
```

## Viewing Submissions

1. Navigate to **Form Submissions** in the sidebar
2. Select your site from the dropdown
3. (Optional) Filter by specific form
4. View all submissions in a table format
5. Click **View Details** on any submission to see the full data

## Features

- ✅ Automatic capture of all form submissions
- ✅ Support for all Webflow form field types (text, email, select, checkbox, radio, etc.)
- ✅ Non-intrusive - works alongside Webflow's native form handling
- ✅ Centralized dashboard for viewing all submissions
- ✅ Filter submissions by site and form
- ✅ Detailed view with raw JSON data
- ✅ Timestamp tracking for all submissions
- ✅ Page context (URL and title) captured with each submission

## Troubleshooting

### Submissions Not Appearing

1. **Check Script Installation**
   - Verify the script is in Webflow's Footer Code
   - Make sure you've published your Webflow site
   - Check browser console for errors

2. **Verify Site ID**
   - Ensure the Site ID in the script matches your actual Webflow site ID
   - Check the Setup page for the correct ID

3. **Test the Webhook**
   ```bash
   curl https://your-domain.com/api/submissions/webhook
   ```
   Should return: `{"status": "active"}`

4. **Check Browser Console**
   - Look for "[Roolify Submission]" log messages
   - Verify the script is loading correctly
   - Check for any JavaScript errors

### Script Not Loading

1. Verify the script URL is correct
2. Check that your Roolify app is running
3. Ensure there are no CORS issues
4. Try hard-refreshing your browser (Cmd+Shift+R or Ctrl+Shift+R)

## Privacy & Security

- All submission data is encrypted in transit (HTTPS)
- Data is stored securely in your Xano database
- Only authenticated users can view submissions
- No third-party services involved

## Supported Field Types

The submission capture system supports all Webflow form field types:

- ✅ Text input
- ✅ Email input
- ✅ Phone input
- ✅ Textarea
- ✅ Checkbox
- ✅ Radio buttons
- ✅ Select dropdown
- ✅ File upload
- ✅ Date picker
- ✅ Number input

## Notes

- Submissions are captured client-side before Webflow processes them
- The script does not interfere with Webflow's native form handling
- All Webflow form notifications and redirects work normally
- Submissions are stored even if Webflow's form submission fails
- The script is lightweight (~2KB) and has minimal performance impact

## Next Steps

After setting up form submissions:

1. Configure form notifications (Notification page)
2. Set up conditional logic rules (Rule Builder page)
3. View and analyze submissions (Form Submissions page)
4. Export submission data if needed

## Support

For issues or questions:
- Check the browser console for error messages
- Verify all setup steps were completed
- Test with a simple form first
- Contact support with specific error messages









