# Quick Start: Form Submissions

## Current Status ✅

Your form submission capture system is now fully set up and working! Here's what's already configured:

- ✅ Webhook endpoint to receive submissions (`/api/submissions/webhook`)
- ✅ Xano database integration (submissions stored in `submission` table)
- ✅ Form Submissions page to view all captured data
- ✅ Test submissions created successfully (2 test entries in database)

## What You See Now

Go to **http://localhost:1337/submissions** to view your submissions page. You should see:
- A table with 2 test submissions
- Submission details including name, email, and message
- Date/time of each submission
- Ability to filter by form (once real forms are captured)

## Next Steps: Capture Real Form Submissions

To start capturing real form submissions from your Webflow site, follow these steps:

### Step 1: Add the Script to Your Webflow Site

1. Open your Webflow project in the Designer
2. Go to **Project Settings** (gear icon in top left)
3. Click **Custom Code** tab
4. Scroll to the **Footer Code** section
5. Copy and paste this script:

```html
<!-- Roolify Form Submission Capture -->
<script src="http://localhost:1337/api/submissions/script/68bc42f58e22a62ce5c282e0"></script>
```

**Important:** 
- For production, replace `localhost:1337` with your actual domain
- The `68bc42f58e22a62ce5c282e0` at the end is your site ID (auto-configured)

6. Click **Save Changes**
7. **Publish your site** (the script only works on the published site, not in the Designer)

### Step 2: Test It

1. Visit your **published** Webflow site (not the Designer preview)
2. Open your browser's **Developer Console** (F12 or Cmd+Option+I)
3. Look for `[Roolify Submission]` log messages - you should see:
   ```
   [Roolify Submission] Initializing for site: 68bc42f58e22a62ce5c282e0
   [Roolify Submission] Found 4 form(s)
   [Roolify Submission] Setting up capture for: Contact Form
   ...
   ```
4. Fill out and submit any form on your site
5. Check the console for:
   ```
   [Roolify] Form submitted: Contact Form
   [Roolify] Capturing submission: { formId: ..., formName: ... }
   [Roolify] Submission saved: 3
   ```
6. Go to **http://localhost:1337/submissions** and refresh - you should see your new submission!

### Step 3: View Your Submissions

On the Form Submissions page (`/submissions`), you can:

- **View all submissions** in a table format
- **Filter by site** using the site dropdown
- **Filter by form** using the form dropdown  
- **View details** by clicking on any submission
- **See metadata** like page URL, submission time, etc.

## How It Works

```
User submits form on Webflow
         ↓
JavaScript script captures data
         ↓
Sends POST to /api/submissions/webhook
         ↓
Webhook stores in Xano database
         ↓
View in Form Submissions page
```

## Troubleshooting

### No submissions appearing

1. **Check the script is loaded:**
   - Open browser console (F12)
   - Look for `[Roolify Submission] Script loaded successfully`
   - If not found, the script isn't loading - check your Webflow Custom Code

2. **Verify you're on the published site:**
   - The script only works on published sites, not in Webflow Designer preview
   - Check the URL - should be your actual domain, not `webflow.io/preview/...`

3. **Check for errors in console:**
   - Look for red error messages
   - Common issues: CORS errors, 404 on script URL, network errors

4. **Test the webhook directly:**
   ```bash
   curl -X POST http://localhost:1337/api/submissions/webhook \
     -H "Content-Type: application/json" \
     -d '{"formId":"test","formName":"Test","siteId":"test","data":{"test":"data"}}'
   ```
   Should return: `{"success":true,...}`

### Script not loading

1. **Check the script URL:**
   - Make sure the URL in your Webflow Custom Code matches your app URL
   - For local dev: `http://localhost:1337/api/submissions/script/[siteId]`
   - For production: `https://your-domain.com/api/submissions/script/[siteId]`

2. **Verify site ID:**
   - Go to `/setup` page
   - Check the displayed Site ID matches the one in your script
   - Update script URL if needed

3. **Check app is running:**
   - Make sure your Next.js app is running on port 1337
   - Test: Visit `http://localhost:1337/api/submissions/webhook` directly
   - Should see: `{"status":"active"}`

## API Endpoints

### GET `/api/submissions`
Fetch all submissions (used by the submissions page)

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": 1,
      "created_at": 1760223484656,
      "form_id": 0,
      "user_id": 1,
      "data": {
        "name": "John Doe",
        "email": "john@example.com",
        "_meta": {
          "formId": "wf-form-Contact-Form",
          "formName": "Contact Form",
          "siteId": "...",
          "submittedAt": "2025-10-11T...",
          "pageUrl": "https://...",
          "pageTitle": "Contact Us"
        }
      }
    }
  ],
  "count": 1
}
```

### POST `/api/submissions/webhook`
Receives form submissions from Webflow sites

**Request:**
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
  "timestamp": "2025-10-11T...",
  "pageUrl": "https://...",
  "pageTitle": "Contact Us"
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": 3,
  "message": "Submission received and stored"
}
```

### GET `/api/submissions/script/[siteId]`
Serves the configured JavaScript capture script

**Example:** `GET /api/submissions/script/68bc42f58e22a62ce5c282e0`

Returns JavaScript file that captures and sends form submissions.

### GET `/api/submissions/test`
Creates a test submission (for testing purposes)

**Response:**
```json
{
  "success": true,
  "message": "Test submission created successfully",
  "submission": { ... }
}
```

## Data in Xano

Submissions are stored in the `submission` table with this structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto-generated ID |
| `created_at` | timestamp | When submitted (milliseconds) |
| `submission_data` | text | JSON string of form data |
| `form_id` | int | Reference to form (if exists) |
| `user_id` | int | Reference to site owner |

The `submission_data` field contains:
```json
{
  "name": "...",
  "email": "...",
  "message": "...",
  "_meta": {
    "formId": "wf-form-...",
    "formName": "Contact Form",
    "siteId": "...",
    "submittedAt": "2025-10-11T...",
    "source": "webflow_webhook",
    "pageUrl": "https://...",
    "pageTitle": "..."
  }
}
```

## For Production

When deploying to production:

1. **Update the script URL** in Webflow Custom Code:
   ```html
   <script src="https://your-domain.com/api/submissions/script/[siteId]"></script>
   ```

2. **Set up proper authentication** (optional):
   - Current setup works without auth for the webhook (Webflow needs to POST)
   - Consider adding API key validation if needed

3. **Monitor submissions:**
   - Check `/submissions` page regularly
   - Set up email notifications (future feature)
   - Export data periodically

## Support

- Check browser console for `[Roolify]` log messages
- Test webhook with curl command above
- Verify script loads: `curl https://your-domain.com/api/submissions/script/[siteId]`
- Check Xano database directly if needed

## Summary

✅ **You're all set up!** Just add the script to your Webflow site and publish it. Your form submissions will start appearing in the app automatically.

🎯 **Current Status:** 2 test submissions in database, ready for real data!









