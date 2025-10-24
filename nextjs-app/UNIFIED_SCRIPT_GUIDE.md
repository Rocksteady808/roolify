# 🚀 Roolify Unified Script - Quick Start Guide

## ONE Script, Everything You Need!

The Roolify Unified Script combines **two powerful features** into a single, easy-to-install script:

1. ✅ **Conditional Logic** - Show/hide form fields based on rules
2. ✅ **Form Submission Capture** - Automatically save all submissions

## 📦 What You Get

### Before (2 Scripts)
```html
<!-- Old way - TWO separate scripts -->
<script src="http://localhost:1337/api/script/serve/YOUR_SITE_ID"></script>
<script src="http://localhost:1337/api/submissions/script/YOUR_SITE_ID"></script>
```

### After (1 Script)
```html
<!-- New way - ONE unified script -->
<script src="http://localhost:1337/api/script/unified/YOUR_SITE_ID"></script>
```

## 🎯 Installation (3 Steps)

### Step 1: Copy Your Script

Go to: **http://localhost:1337/setup**

Copy the script shown (it will look like this):
```html
<!-- Roolify Unified Script - Handles BOTH Conditional Logic AND Form Submissions -->
<script src="http://localhost:1337/api/script/unified/68bc42f58e22a62ce5c282e0"></script>
```

### Step 2: Add to Webflow

1. Open your Webflow project
2. Go to **Project Settings** → **Custom Code**
3. Scroll to **Footer Code** section
4. Paste the script
5. Click **Save**

### Step 3: Publish

Click **Publish** in Webflow - that's it! 🎉

## ⚡ Features Included

### Feature 1: Conditional Logic

The script automatically:
- ✅ Loads your rules from Roolify
- ✅ Executes show/hide logic based on user input
- ✅ Supports AND/OR logic
- ✅ Updates in real-time as users interact with forms

**Example:**
- You create a rule: "When Country = USA, show State field"
- User selects USA → State field appears
- No extra work needed!

### Feature 2: Form Submission Capture

The script automatically:
- ✅ Captures all form submissions
- ✅ Sends data to Roolify
- ✅ Stores in Xano database
- ✅ Works with ALL Webflow form types

**Example:**
- User fills out a form
- Clicks Submit
- Data instantly appears in **http://localhost:1337/submissions**

## 🔍 How It Works

```
User visits your Webflow site
         ↓
Script loads (once per page)
         ↓
┌────────────────────────────┐
│  Conditional Logic Active  │ ← Watches form interactions
│  Rules execute in real-time│
└────────────────────────────┘
         ↓
User fills out form
         ↓
Clicks Submit
         ↓
┌────────────────────────────┐
│  Submission Capture Active │ ← Intercepts form data
│  Sends to Roolify          │
└────────────────────────────┘
         ↓
Data saved to Xano
         ↓
Visible in /submissions page
```

## 📊 What Gets Captured

### Form Data
- ✅ Text inputs
- ✅ Email fields
- ✅ Textareas
- ✅ Select dropdowns
- ✅ Checkboxes
- ✅ Radio buttons
- ✅ File uploads

### Metadata
- ✅ Form name & ID
- ✅ Page URL
- ✅ Page title
- ✅ Submission timestamp
- ✅ Site ID

## 🧪 Testing

### Test Conditional Logic

1. Go to **http://localhost:1337/rule-builder**
2. Create a test rule (e.g., "When Field A = 'test', show Field B")
3. Visit your published Webflow site
4. Fill out the form to trigger the rule
5. Field B should appear/hide as expected

### Test Form Submissions

1. Visit your published Webflow site
2. Fill out any form
3. Click Submit
4. Go to **http://localhost:1337/submissions**
5. Your submission should appear!

## 🐛 Troubleshooting

### Script Not Loading?

**Check:**
1. ✅ Script added to Footer Code (not Header)
2. ✅ Site has been published after adding script
3. ✅ Correct site ID in script URL
4. ✅ Roolify app is running (`npm run dev`)

**Test:**
```bash
# Check if script endpoint is accessible
curl http://localhost:1337/api/script/unified/YOUR_SITE_ID
```

### Rules Not Working?

**Check:**
1. ✅ Rules are active (toggle is ON)
2. ✅ Field IDs match exactly
3. ✅ Browser console for errors (F12 → Console)

**Look for:**
```
[Roolify] Unified script loaded
[Roolify] Site ID: your-site-id
[Roolify] Rules loaded: X
```

### Submissions Not Showing?

**Check:**
1. ✅ Forms are being submitted successfully
2. ✅ Browser console for errors
3. ✅ Webhook endpoint is accessible

**Test webhook directly:**
```bash
curl -X POST http://localhost:1337/api/submissions/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "_meta": {
      "formId": "test",
      "formName": "Test",
      "siteId": "YOUR_SITE_ID",
      "submittedAt": "2025-10-12T00:00:00.000Z"
    }
  }'
```

### Browser Console Messages

**Normal (Success):**
```
[Roolify] Unified script loaded
[Roolify] Site ID: 68bc42f58e22a62ce5c282e0
[Roolify] Rules loaded: 3
[Roolify] Found 4 forms to monitor
[Roolify] Monitoring form: Contact-Form
[Roolify] Conditional logic initialized
[Roolify] ✓ Unified script initialized successfully
```

**After form submission:**
```
[Roolify] Form submitted: Contact Form
[Roolify] Sending submission: {name: "John", email: "john@example.com", ...}
[Roolify] Submission saved successfully: {success: true, ...}
```

**Errors to watch for:**
```
[Roolify] Failed to load unified script
[Roolify] Failed to save submission
[Roolify] Field not found: field-id
```

## 🎨 Customization

The unified script is generated dynamically and includes:
- Your active rules (fetched from Roolify)
- Your site ID (automatically configured)
- Webhook URL (points to your Roolify instance)

**No customization needed!** Just install and go.

## 📈 Next Steps

1. ✅ **Install the script** (3 steps above)
2. ✅ **Create rules** → http://localhost:1337/rule-builder
3. ✅ **Test on your site** → Visit your published Webflow site
4. ✅ **View submissions** → http://localhost:1337/submissions

## 🔗 Related Pages

- **Setup Guide**: http://localhost:1337/setup
- **Rule Builder**: http://localhost:1337/rule-builder
- **Form Submissions**: http://localhost:1337/submissions
- **Dashboard**: http://localhost:1337/dashboard

## 💡 Pro Tips

### 1. Test in Staging First
Use your `.webflow.io` staging URL to test before publishing to your custom domain.

### 2. Check Console Logs
Open browser DevTools (F12) and watch the Console tab for helpful Roolify messages.

### 3. Use Descriptive Rule Names
Name your rules clearly (e.g., "Show State when USA selected") for easier debugging.

### 4. One Script Per Site
Each site needs its own script with its unique Site ID.

### 5. Keep Roolify Running
The script communicates with your Roolify app, so make sure it's running:
```bash
cd nextjs-app
npm run dev
```

## 🚨 Important Notes

1. **Single Script**: Remove any old Roolify scripts and use only the unified script
2. **Footer Code**: Always add to Footer (not Header) for best compatibility
3. **Publish Required**: Changes only take effect after publishing your Webflow site
4. **Site ID**: Each site needs its own unique script URL

## ✨ Benefits

| Feature | Before (2 Scripts) | After (1 Script) |
|---------|-------------------|------------------|
| **Installation** | Add 2 scripts | Add 1 script |
| **Maintenance** | Update 2 scripts | Update 1 script |
| **Loading Time** | 2 HTTP requests | 1 HTTP request |
| **Conflicts** | Possible | None |
| **Simplicity** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎉 You're Done!

Once the script is installed, you can:
- ✅ Create rules → They work immediately
- ✅ Forms are submitted → Data appears in Submissions
- ✅ No more configuration needed

**Everything just works!** 🚀

---

**Questions?** Check the browser console or test the endpoints directly.
**Last Updated**: October 12, 2025
**Script Endpoint**: `/api/script/unified/[siteId]`








