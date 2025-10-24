# Roolify - Automatic Form Collection Setup

## Overview

Roolify automatically collects all form data from your Webflow site, including **select dropdown options**, **radio button values**, and **checkbox options**. No manual scanning required!

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Script

1. Open Roolify Dashboard: http://localhost:3000/setup
2. Copy the generated script code

### Step 2: Add to Webflow

1. Open your Webflow project
2. Go to **Project Settings → Custom Code**
3. Paste the script in the **"Footer Code"** section
4. Click **Save** and **Publish** your site

### Step 3: Visit Your Site

1. Visit any page with a form on your published Webflow site
2. The script will automatically collect all form data
3. Refresh your Roolify Dashboard to see the forms

## ✨ What Gets Collected

The script automatically detects:

- ✅ **All form fields** (text, email, select, radio, checkbox, etc.)
- ✅ **Select dropdown options** with their actual values
- ✅ **Radio button groups** with all options
- ✅ **Checkbox groups** with all options
- ✅ **Div elements with IDs** for show/hide logic
- ✅ **Field labels** and display names

## 🎯 How It Works

1. **Script loads** when someone visits your page
2. **Scans all forms** and their fields
3. **Extracts select options** from the DOM
4. **Sends data** to your Roolify app automatically
5. **You create rules** using the real dropdown values!

## 📋 Example Script

```html
<!-- Roolify Form Collector -->
<script src="http://localhost:3000/form-collector.js"></script>
<script>
  RoolifyFormCollector.init({
    apiUrl: 'http://localhost:3000/api/forms/collect',
    siteId: 'your-site-id-here'
  });
</script>
```

## 🔒 Privacy & Performance

- **Lightweight**: < 5KB script size
- **Privacy-friendly**: Only collects form structure, not user data
- **Fast**: Runs after page load, doesn't slow down your site
- **Secure**: Data sent only to your Roolify app

## 💡 Benefits Over Manual Scanning

| Manual Scanning | Automatic Collection |
|-----------------|---------------------|
| ❌ Enter URL every time | ✅ Automatic on page load |
| ❌ Can fail with 404 errors | ✅ Always works |
| ❌ Doesn't work with auth pages | ✅ Works everywhere |
| ❌ Manual process | ✅ Set it and forget it |

## 🛠️ Troubleshooting

### Forms not showing up?

1. **Check the browser console** on your published site
2. Look for `[Roolify] Collected X forms` message
3. Make sure the script is in **Footer Code** (not Head Code)
4. Verify your **siteId** is correct

### Select options not appearing?

1. Make sure you're visiting the **published site** (not Webflow preview)
2. The script needs to run on the actual page with forms
3. Check that select elements have actual `<option>` tags

### Still having issues?

1. Check the Network tab in browser dev tools
2. Look for POST request to `/api/forms/collect`
3. Check the response for errors

## 🎉 You're Done!

Once set up, you'll never have to manually scan again. Every time someone visits your form pages, Roolify will have the latest form data ready for creating rules!





