# Form Submission Setup - Quick Guide

## Overview

Your Roolify app now automatically captures form submissions from your Webflow site and displays them in the Submissions page. Here's how it works:

## How It Works

```
User fills out form on Webflow site
         ↓
Roolify capture script intercepts submission
         ↓
Data sent to webhook endpoint
         ↓
Stored in Xano database
         ↓
Appears in Submissions page
```

## Setup Steps

### 1. Add the Capture Script to Your Webflow Site

1. Go to your Webflow project
2. Open **Project Settings** → **Custom Code**
3. Scroll to **Footer Code** section
4. Add this script:

```html
<!-- Roolify Form Submission Capture -->
<script src="http://localhost:1337/api/submissions/script/YOUR_SITE_ID"></script>
```

**Replace `YOUR_SITE_ID`** with your actual Webflow site ID (you can find it in the Dashboard).

### 2. Publish Your Site

After adding the script:
1. Click **Publish** in Webflow
2. The script is now active on your published site

### 3. Test Form Submission

1. Go to your published Webflow site
2. Fill out a form and click Submit
3. Go to `http://localhost:1337/submissions`
4. You should see your submission appear!

## What Gets Captured

The script captures:
- ✅ All form field values (text, email, checkboxes, radio buttons, selects)
- ✅ Form name and ID
- ✅ Site ID
- ✅ Page URL and title
- ✅ Submission timestamp
- ✅ User-friendly field names

## Viewing Submissions

### Submissions Page Features

1. **Select Site**: Choose which site's submissions to view
2. **Select Form**: Filter by specific form (or view all)
3. **Source Badges**: See where submissions came from:
   - 🟣 **Purple Badge** - Direct from Webflow API
   - 🔵 **Blue Badge** - Captured by Roolify script
4. **View Details**: Click any submission to see full data

### Stats Displayed

- **Form Submissions**: Count for selected form
- **All Submissions**: Total across all forms
- **Last 24 Hours**: Recent submission count

## Example Form Submission Flow

### 1. User Submits Form on Webflow

```html
<form data-name="Contact Form" id="wf-form-Contact-Form">
  <input type="text" name="name" data-name="Name" />
  <input type="email" name="email" data-name="Email" />
  <textarea name="message" data-name="Message"></textarea>
  <button type="submit">Submit</button>
</form>
```

### 2. Script Captures Data

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  message: "Hello!",
  _meta: {
    formId: "wf-form-Contact-Form",
    formName: "Contact Form",
    siteId: "68bc42f58e22a62ce5c282e0",
    pageUrl: "https://yoursite.webflow.io/contact",
    pageTitle: "Contact Us",
    submittedAt: "2025-10-12T15:30:00.000Z",
    source: "roolify_collector"
  }
}
```

### 3. Sent to Webhook

```
POST http://localhost:1337/api/submissions/webhook
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "_meta": { ... }
}
```

### 4. Stored in Xano

The webhook endpoint saves it to your Xano `submission` table with:
- `submission_data`: The form field values
- `form_id`: The form identifier
- `user_id`: Associated user (default: 1)
- `created_at`: Timestamp

### 5. Displayed in Submissions Page

View it at: `http://localhost:1337/submissions`

## Troubleshooting

### No Submissions Showing Up

**Check:**
1. ✅ Script is added to Webflow Footer Code
2. ✅ Site has been published after adding script
3. ✅ Correct site ID in script URL
4. ✅ Xano webhook endpoint is accessible
5. ✅ Browser console for errors (F12 → Console)

**Test the webhook directly:**
```bash
curl -X POST http://localhost:1337/api/submissions/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "_meta": {
      "formId": "test-form",
      "formName": "Test Form",
      "siteId": "YOUR_SITE_ID",
      "submittedAt": "2025-10-12T15:30:00.000Z"
    }
  }'
```

### Script Not Loading

**Check:**
1. ✅ Your Next.js app is running (`npm run dev`)
2. ✅ Port 1337 is accessible
3. ✅ No CORS errors in browser console

### Submissions Not Saving to Xano

**Check:**
1. ✅ Xano API credentials in `.env.local`
2. ✅ Xano `submission` table exists
3. ✅ Table has correct fields (submission_data, form_id, user_id, created_at)

**Test Xano connection:**
```bash
curl http://localhost:1337/api/submissions
```

Should return existing submissions or empty array.

## Script Location

The form submission capture script is located at:
```
nextjs-app/public/form-submission-capture.js
```

It's automatically served with your site ID via:
```
nextjs-app/app/api/submissions/script/[siteId]/route.ts
```

## API Endpoints

### Webhook Endpoint
- **URL**: `/api/submissions/webhook`
- **Method**: POST
- **Purpose**: Receives form submission data from Webflow site

### Script Endpoint
- **URL**: `/api/submissions/script/[siteId]`
- **Method**: GET
- **Purpose**: Serves the pre-configured capture script

### Submissions List
- **URL**: `/api/submissions`
- **Method**: GET
- **Purpose**: Fetches all submissions from Xano

### Webflow API Submissions
- **URL**: `/api/webflow/submissions/[siteId]`
- **Method**: GET
- **Purpose**: Fetches submissions from Webflow's native API

## Data Sources

Your app pulls submissions from **two sources**:

1. **Xano Captured** (🔵 Blue Badge)
   - Submissions captured by your Roolify script
   - Stored in your Xano database
   - Includes custom metadata

2. **Webflow API** (🟣 Purple Badge)
   - Native Webflow submissions
   - Retrieved via Webflow Data API
   - Includes official Webflow data

Both sources are combined and displayed together in the Submissions page!

## Next Steps

1. ✅ Add script to Webflow site
2. ✅ Publish site
3. ✅ Test a form submission
4. ✅ View in Submissions page
5. 🎉 Start collecting form data!

## Support

If submissions aren't showing up:
1. Check browser console (F12) for errors
2. Verify script is loading (Network tab)
3. Test webhook endpoint directly
4. Check Xano database for new records

---

**Last Updated**: October 12, 2025
**App URL**: http://localhost:1337
**Submissions Page**: http://localhost:1337/submissions








